import { AiParseResponse, DiagnosticsResult } from './types';

const SYSTEM_PROMPT = `
你是一位專業的繁體中文餐廳與手搖飲料店菜單視覺結構化解析專家。
你的任務是精準解析使用者上傳的菜單照片或圖片，提取所有餐點/飲品品項、價格與客製化規格設定，並輸出為嚴格標準的 JSON 物件。

【辨識核心規則】：
1. 繁體中文標準化：所有餐點名稱與選項請統一輸出為台灣常用繁體中文（例如「檸檬」、「奶茶」、「雞排」）。
2. 價格提取：
   - 價格必須為純整數（number，不可帶 $ 或元字元）。
   - 若餐點標示 M / L（中杯/大杯）不同價（例如 M: 50, L: 60），請以較小容量或基本價格為 price（如 50），並在 custom_groups 加入「容量大小」規格組（如中杯:0元，大杯:10元）；或者直接拆分為「珍珠奶茶(中)」與「珍珠奶茶(大)」兩項。
3. 規格與客製化提取 (custom_groups)：
   - 若菜單上有全店通用的「甜度/冰塊」選擇（如正常甜、少糖、半糖、微糖、無糖；正常冰、少冰、微冰、去冰），請為適合的飲料品項自動綁定此 custom_groups。
   - 若有「加料區」（如珍珠+10、椰果+10、仙草+10），請建立 type 為 "multiple" 的客製組。
   - 若為便當/餐點店，請提取「主餐/飯量/附湯/辣度/套餐加購」等規格。
4. 容錯處理：
   - 即使圖片有些許陰影或排版複雜，請仔細閱讀每個區塊並盡可能提取所有餐點。
   - 排除純廣告標語、地址、電話、外送須知等非品項文字。

【輸出 JSON Schema】：
必須以 JSON 格式回應，頂層結構如下：
{
  "store_name": "店家名稱（若圖片中可辨識）",
  "category_name": "類別名稱（如手搖飲料/便當快餐/早午餐）",
  "items": [
    {
      "name": "餐點名稱 (string, 必填)",
      "price": 50,
      "description": "餐點簡介或標語（若無可為空字串）",
      "category": "該品項所屬小分類（如原茶系列/鮮奶系列/主廚推薦）",
      "is_sold_out": false,
      "custom_groups": [
        {
          "title": "甜度選擇",
          "type": "single",
          "options": [
            { "name": "正常甜 (100%)", "price": 0 },
            { "name": "少糖 (70%)", "price": 0 },
            { "name": "半糖 (50%)", "price": 0 },
            { "name": "微糖 (30%)", "price": 0, "is_default": true },
            { "name": "無糖 (0%)", "price": 0 }
          ]
        }
      ]
    }
  ]
}
`;

// 🛡️ 深度容錯 JSON 提取與救援解析引擎
export function extractAndCleanJson(rawText: string): AiParseResponse {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI 未回傳任何文字內容');
  }

  const trimmed = rawText.trim();

  // 1. 偵測自然語言報錯
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('an error') ||
    lower.startsWith('error:') ||
    lower.startsWith('i cannot') ||
    lower.startsWith('i am sorry') ||
    lower.startsWith('抱歉') ||
    lower.startsWith('無法識別')
  ) {
    throw new Error(`AI 解析提示：${trimmed.slice(0, 120)}`);
  }

  // 2. 尋找 Markdown 代碼塊
  const mdMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let candidate = mdMatch ? mdMatch[1].trim() : trimmed;

  // 3. 尋找最外層的大括號
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidate = candidate.slice(firstBrace, lastBrace + 1);
  }

  // 4. 初次嘗試標準 JSON 解析
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && Array.isArray(parsed.items)) {
      return sanitizeAiResponse(parsed);
    }
    if (Array.isArray(parsed)) {
      return sanitizeAiResponse({ items: parsed });
    }
  } catch {}

  // 5. 救援修復常見語法缺陷（如尾隨逗號、未閉合字串等）
  const repaired = candidate
    .replace(/,\s*([}\]])/g, '$1') // 移除多餘尾隨逗號
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // 補齊未加引號的 key
    .replace(/:\s*'([^']*)'/g, ':"$1"') // 單引號轉雙引號
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // 移除非法控制字元

  try {
    const parsed = JSON.parse(repaired);
    if (parsed && Array.isArray(parsed.items)) {
      return sanitizeAiResponse(parsed);
    }
    if (Array.isArray(parsed)) {
      return sanitizeAiResponse({ items: parsed });
    }
  } catch (e: any) {
    console.error('[AI Parse Error] Raw text sample:', rawText.slice(0, 300));
    throw new Error(`JSON 解析失敗 (${e.message})，AI 原始輸出可能不完整。`);
  }

  throw new Error('AI 回傳的資料結構不符合餐點列表格式');
}

// 整理並校驗 AI 回傳欄位資料
function sanitizeAiResponse(data: any): AiParseResponse {
  const items = Array.isArray(data.items) ? data.items : [];
  const sanitizedItems = items
    .filter((item: any) => item && typeof item.name === 'string' && item.name.trim().length > 0)
    .map((item: any) => {
      let price = typeof item.price === 'number' ? Math.max(0, Math.round(item.price)) : 0;
      if (typeof item.price === 'string') {
        const num = parseInt(item.price.replace(/[^\d]/g, ''), 10);
        price = !isNaN(num) ? num : 0;
      }

      const custom_groups = Array.isArray(item.custom_groups)
        ? item.custom_groups
            .filter((cg: any) => cg && typeof cg.title === 'string' && Array.isArray(cg.options))
            .map((cg: any) => ({
              title: String(cg.title).trim().slice(0, 30),
              type: cg.type === 'multiple' ? 'multiple' : 'single',
              options: cg.options
                .filter((opt: any) => opt && typeof opt.name === 'string')
                .map((opt: any) => ({
                  name: String(opt.name).trim().slice(0, 30),
                  price: typeof opt.price === 'number' ? Math.max(0, Math.round(opt.price)) : 0,
                  is_default: Boolean(opt.is_default),
                })),
            }))
        : [];

      return {
        name: String(item.name).trim().slice(0, 60),
        price,
        description: item.description ? String(item.description).trim().slice(0, 200) : '',
        category: item.category ? String(item.category).trim().slice(0, 30) : '推薦商品',
        is_sold_out: Boolean(item.is_sold_out),
        custom_groups,
      };
    });

  return {
    store_name: data.store_name ? String(data.store_name).trim().slice(0, 50) : undefined,
    category_name: data.category_name ? String(data.category_name).trim().slice(0, 30) : undefined,
    items: sanitizedItems,
  };
}

// 🧪 執行自主診斷與可用模型探測
export async function runDiagnostics(apiKey: string): Promise<DiagnosticsResult> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const trace: string[] = [];
  const startTime = Date.now();

  try {
    trace.push('開始向 Google Gemini API 發送權限與模型清單探測...');
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const latency = Date.now() - startTime;
    trace.push(`Google API 回應狀態碼: ${listRes.status} (耗時 ${latency}ms)`);

    if (!listRes.ok) {
      const errText = await listRes.text();
      let errorMsg = `Google API 回傳錯誤碼 ${listRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {}

      trace.push(`探測失敗: ${errorMsg}`);
      return {
        healthy: false,
        latency,
        status: listRes.status,
        message: errorMsg,
        inferenceTest: '未通過',
        supportedModels: [],
        trace,
      };
    }

    const data = await listRes.json();
    const supportedModels: string[] = [];

    if (Array.isArray(data.models)) {
      for (const m of data.models) {
        const name = String(m.name || '').replace(/^models\//, '');
        if (
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          !name.includes('embedding') &&
          !name.includes('aqa')
        ) {
          supportedModels.push(name);
        }
      }
    }

    trace.push(`共找到 ${supportedModels.length} 款可用視覺/文字生成模型: ${supportedModels.slice(0, 3).join(', ')}...`);

    // 2. 進行微探針生成測試
    let inferencePassed = false;
    let inferenceMsg = '';
    const testModel = supportedModels.includes('gemini-1.5-flash') ? 'gemini-1.5-flash' : supportedModels[0] || 'gemini-1.5-flash';

    try {
      trace.push(`發送微探針至模型 ${testModel}...`);
      const testRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: '請回覆 OK' }] }],
          }),
        }
      );
      if (testRes.ok) {
        inferencePassed = true;
        inferenceMsg = '端對端文字生成測試成功！';
        trace.push(`微探針生成測試成功 (200 OK)`);
      } else {
        const testErr = await testRes.text();
        inferenceMsg = `微探針狀態碼 ${testRes.status}: ${testErr.slice(0, 80)}`;
        trace.push(`微探針測試未通過: ${inferenceMsg}`);
      }
    } catch (ie: any) {
      inferenceMsg = ie.message || '測試連線失敗';
      trace.push(`微探針拋出例外: ${inferenceMsg}`);
    }

    return {
      healthy: true,
      latency,
      status: 200,
      message: inferencePassed ? 'API Key 授權完整且生成正常！' : `API Key 連線成功但生成異常 (${inferenceMsg})`,
      inferenceTest: inferencePassed ? '✅ 成功' : '⚠️ 異常',
      supportedModels,
      trace,
    };
  } catch (e: any) {
    trace.push(`診斷過程發生例外: ${e.message}`);
    return {
      healthy: false,
      latency: Date.now() - startTime,
      status: 500,
      message: e.message || '連線至 Google API 伺服器逾時',
      inferenceTest: '失敗',
      supportedModels: [],
      trace,
    };
  }
}

// 🧠 呼叫 Google Gemini Vision API（多重模型降級與診斷追蹤）
export async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  storeName?: string
): Promise<{ result: AiParseResponse; trace: string[] }> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').trim();
  const trace: string[] = [];

  const userPrompt = storeName
    ? `請辨識這張【${storeName}】的實體菜單圖片，提取所有餐點、價格與客製化加料/甜度冰塊規格，輸出為規範的 JSON。`
    : '請辨識這張菜單圖片，提取所有餐點、價格與客製化規格，輸出為規範的 JSON。';

  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    const attempts = [
      { mode: '標準模式', useJsonMime: true, useSafety: true },
      { mode: '降級純文字模式', useJsonMime: false, useSafety: false },
    ];

    for (const attempt of attempts) {
      try {
        trace.push(`正在嘗試模型 [${model}] (${attempt.mode})...`);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

        const bodyPayload: any = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${SYSTEM_PROMPT}\n\n${userPrompt}` },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
            ...(attempt.useJsonMime ? { responseMimeType: 'application/json' } : {}),
          },
        };

        if (attempt.useSafety) {
          bodyPayload.safetySettings = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ];
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        const rawResponseBody = await response.text();
        trace.push(`模型 [${model}] 回應狀態碼: ${response.status}`);

        if (!response.ok) {
          let errMsg = `Google API (${model}) 回應 ${response.status}: ${rawResponseBody.slice(0, 100)}`;
          try {
            const errJson = JSON.parse(rawResponseBody);
            if (errJson?.error?.message) {
              errMsg = errJson.error.message;
              if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
                throw new Error('填入的 Google Gemini API Key 無效，請確認金鑰是否完整複製！');
              }
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && jsonErr.message.includes('API Key')) throw jsonErr;
          }

          trace.push(`[${model}] 錯誤: ${errMsg}`);

          if (
            response.status === 404 ||
            rawResponseBody.includes('Interactions API') ||
            rawResponseBody.includes('not supported for generateContent')
          ) {
            continue;
          }

          if (response.status === 400 && attempt.useJsonMime) {
            continue;
          }

          throw new Error(errMsg);
        }

        let parsedApiJson: any = null;
        try {
          parsedApiJson = JSON.parse(rawResponseBody);
        } catch {
          throw new Error('Google API 回傳非預期 JSON 格式');
        }

        const candidates = parsedApiJson?.candidates;
        if (!candidates || candidates.length === 0) {
          const blockReason = parsedApiJson?.promptFeedback?.blockReason;
          if (blockReason) {
            throw new Error(`Google 內容安全過濾攔截: ${blockReason}`);
          }
          throw new Error('Google API 未回傳任何候選答案');
        }

        const textOutput = candidates[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          throw new Error('Google API 候選答案中缺少文字內容');
        }

        trace.push(`[${model}] 成功取得輸出，開始執行 JSON 救援清洗...`);
        const cleanedResult = extractAndCleanJson(textOutput);
        trace.push(`[${model}] 成功解析出 ${cleanedResult.items.length} 道餐點品項！`);

        return {
          result: cleanedResult,
          trace,
        };
      } catch (err: any) {
        lastError = err;
        trace.push(`[${model}] 嘗試失敗: ${err.message}`);
      }
    }
  }

  throw new Error(
    lastError?.message || '所有 AI 模型嘗試皆未成功，請確認 API Key 額度或更換圖片重試。'
  );
}
