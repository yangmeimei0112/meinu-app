import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-util';

export interface AiParsedOption {
  name: string;
  price: number;
  is_default?: boolean;
}

export interface AiParsedCustomGroup {
  title: string;
  type: 'single' | 'multiple';
  options: AiParsedOption[];
}

export interface AiParsedMenuItem {
  name: string;
  price: number;
  description?: string;
  category?: string;
  is_sold_out?: boolean;
  custom_groups?: AiParsedCustomGroup[];
}

export interface AiParseResponse {
  store_name?: string;
  category_name?: string;
  items: AiParsedMenuItem[];
}

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
function extractAndCleanJson(rawText: string): AiParseResponse {
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
  let jsonString = '';
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    // 3. 尋找最外層的 { ... } 或 [ ... ]
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = trimmed.substring(firstBrace, lastBrace + 1);
    } else {
      const firstBracket = trimmed.indexOf('[');
      const lastBracket = trimmed.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonString = trimmed.substring(firstBracket, lastBracket + 1);
      } else {
        jsonString = trimmed;
      }
    }
  }

  // 4. 清理常見 JSON 語法瑕疵
  jsonString = jsonString
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();

  // 5. 標準 JSON 解析
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { items: parsed };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed;
    }
  } catch (parseErr: any) {
    console.warn('[JSON Parse Warning] 嘗試正規表達式救援提取:', parseErr.message);
  }

  // 6. 正規表達式行內救援提取
  const rescuedItems: AiParsedMenuItem[] = [];
  const lines = trimmed.split('\n');
  const itemRegex = /^[\s*-]*([\u4e00-\u9fa5a-zA-Z0-9\s()（）+-_/]+?)\s*[:：$＄]?\s*(\d{1,4})\s*(?:元|NT|NT\$)?$/;

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length > 40) continue;

    const match = cleanLine.match(itemRegex);
    if (match && match[1] && match[2]) {
      const name = match[1].replace(/^[0-9]+[.\-、]\s*/, '').trim();
      const price = parseInt(match[2], 10);
      if (name.length >= 2 && !isNaN(price) && price > 0 && price < 5000) {
        rescuedItems.push({
          name,
          price,
          description: '',
          category: '辨識品項',
          is_sold_out: false,
          custom_groups: [],
        });
      }
    }
  }

  if (rescuedItems.length > 0) {
    return { items: rescuedItems };
  }

  throw new Error('未能從圖片文字中解析出餐點品項與單價');
}

// 🔍 智慧金鑰診斷與端對端微探針 (End-to-End Diagnostic Probe)
async function diagnoseGeminiKey(apiKey: string) {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const startTime = Date.now();
  const trace: string[] = [];

  try {
    trace.push(`開始探測 Google Generative AI API (Key 前綴: ${cleanKey.slice(0, 7)}...)`);

    // 1. 探測可用模型清單
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
      cache: 'no-store',
    });

    const latency = Date.now() - startTime;
    trace.push(`模型清單查詢回應狀態碼: ${listRes.status} (耗時 ${latency}ms)`);

    if (!listRes.ok) {
      const errText = await listRes.text();
      let errorMsg = `Google API 回應狀態碼 ${listRes.status}: ${errText}`;
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

    // 2. 進行微探針生成測試 (Test Inference)
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

// 🧠 呼叫 Google Gemini Vision API（多重保險與完整診斷追蹤）
async function callGeminiVision(
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
    // 雙策略嘗試：先嘗試標準 JSON 模式，若失敗則降級為純文字 Prompt 模式
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
            continue; // 降級至純文字模式嘗試
          }

          throw new Error(errMsg);
        }

        let parsedApiJson: any = null;
        try {
          parsedApiJson = JSON.parse(rawResponseBody);
        } catch {
          throw new Error('Google API 回傳非預期 JSON 格式');
        }

        if (parsedApiJson.promptFeedback?.blockReason) {
          trace.push(`[${model}] 安全審查阻擋: ${parsedApiJson.promptFeedback.blockReason}`);
          throw new Error(`Google 安全防護攔截：${parsedApiJson.promptFeedback.blockReason}`);
        }

        const candidateText = parsedApiJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          const finishReason = parsedApiJson.candidates?.[0]?.finishReason;
          trace.push(`[${model}] 未產出內容，結束狀態: ${finishReason || '未知'}`);
          throw new Error(`Google API 未能產生文字內容 (結束狀態: ${finishReason || '未知'})`);
        }

        trace.push(`[${model}] 成功接收 ${candidateText.length} 字元之辨識結果，開始提取 JSON...`);
        const result = extractAndCleanJson(candidateText);
        if (result && Array.isArray(result.items) && result.items.length > 0) {
          trace.push(`[${model}] 成功提取 ${result.items.length} 道菜單餐點！`);
          return { result, trace };
        }
      } catch (e: any) {
        trace.push(`[${model}] 例外: ${e.message}`);
        lastError = e;
        if (e.message && e.message.includes('API Key')) {
          throw e;
        }
      }
    }
  }

  const detailedMessage = `所有 AI 模型解析皆未能成功提取餐點。\n原因: ${lastError?.message || '未知錯誤'}`;
  const errorWithTrace: any = new Error(detailedMessage);
  errorWithTrace.trace = trace;
  throw errorWithTrace;
}

// 🧠 呼叫 OpenAI Vision API
async function callOpenAiVision(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  storeName?: string
): Promise<{ result: AiParseResponse; trace: string[] }> {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').trim();
  const trace: string[] = ['使用 OpenAI GPT-4o-mini Vision 辨識...'];

  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${cleanBase64}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: storeName
                ? `請辨識這張【${storeName}】的實體菜單圖片，解析出所有餐點、價格與規格。`
                : '請辨識這張菜單圖片，解析出所有餐點、價格與規格。',
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  trace.push(`OpenAI 回應狀態碼: ${response.status}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API 錯誤 (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('OpenAI API 未回傳內容');
  }

  const result = extractAndCleanJson(rawText);
  return { result, trace };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('meinu_admin_token')?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, message: '存取被拒：請先在後台完成管理者身分驗證！' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, imageBase64, mimeType = 'image/jpeg', storeName, customApiKey } = body;

    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (action === 'diagnose') {
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          needsApiKey: true,
          message: '尚未設定 API Key，請先貼上金鑰後再執行診斷！',
        });
      }
      const diagResult = await diagnoseGeminiKey(apiKey);
      return NextResponse.json({
        success: diagResult.healthy,
        diagnostic: diagResult,
      });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '未接收到有效的菜單圖片資料' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          needsApiKey: true,
          message:
            '尚未設定 AI API Key！請點擊右上角「金鑰設定」貼上您的 Google Gemini API Key，即可免費使用。',
        },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
    let parseData: { result: AiParseResponse; trace: string[] };

    if (cleanKey.startsWith('sk-')) {
      parseData = await callOpenAiVision(imageBase64, mimeType, cleanKey, storeName);
    } else {
      parseData = await callGeminiVision(imageBase64, mimeType, cleanKey, storeName);
    }

    const { result, trace } = parseData;

    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI 未能在圖片中識別出明確的餐點品項，請嘗試更換近距離拍攝的照片！',
          debugTrace: trace,
        },
        { status: 200 }
      );
    }

    const sanitizedItems = result.items.map((item, idx) => ({
      tempId: `ai_item_${Date.now()}_${idx}`,
      name: String(item.name || `未命名餐點 ${idx + 1}`).trim(),
      price: Math.max(0, Number(item.price) || 0),
      description: item.description ? String(item.description).trim() : '',
      category: item.category ? String(item.category).trim() : (result.category_name || '精選餐點'),
      is_sold_out: Boolean(item.is_sold_out),
      custom_groups: Array.isArray(item.custom_groups)
        ? item.custom_groups.map((cg, cgIdx) => ({
            id: `cg_${Date.now()}_${cgIdx}`,
            title: String(cg.title || '規格選項').trim(),
            type: cg.type === 'multiple' ? 'multiple' : 'single',
            options: Array.isArray(cg.options)
              ? cg.options.map((opt, optIdx) => ({
                  id: `opt_${Date.now()}_${cgIdx}_${optIdx}`,
                  name: String(opt.name || '選項').trim(),
                  price: Math.max(0, Number(opt.price) || 0),
                  is_default: Boolean(opt.is_default),
                }))
              : [],
          }))
        : [],
      selected: true,
    }));

    return NextResponse.json({
      success: true,
      storeName: result.store_name || storeName || '',
      categoryName: result.category_name || '',
      items: sanitizedItems,
      totalCount: sanitizedItems.length,
      debugTrace: trace,
    });
  } catch (err: any) {
    console.error('[AI-Parse API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'AI 菜單解析失敗，請稍後重試',
        debugTrace: err.trace || [],
      },
      { status: 200 }
    );
  }
}
