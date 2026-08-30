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
   - 若品項文字因反光稍微模糊，請依上下文推斷最可能的餐點名稱。
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

// 🛡️ 深度容錯 JSON 提取與修復引擎 (Resilient JSON Sanitizer & Regex Extractor)
function extractAndCleanJson(rawText: string): AiParseResponse {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI 未回傳任何文字內容');
  }

  const trimmed = rawText.trim();

  // 1. 偵測是否為 AI 的自然語言報錯訊息（如 "An error occurred", "I cannot read..."）
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('an error') ||
    lower.startsWith('error:') ||
    lower.startsWith('i cannot') ||
    lower.startsWith('i am sorry') ||
    lower.startsWith('抱歉') ||
    lower.startsWith('無法識別')
  ) {
    throw new Error(`AI 解析提示：${trimmed.slice(0, 120)}（建議更換清晰、光線充足的菜單照片後重試）`);
  }

  // 2. 尋找 Markdown 代碼塊 ```json ... ```
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

  // 4. 清理常見 JSON 格式語法錯誤（末尾多餘逗號、控制字元）
  jsonString = jsonString
    .replace(/,\s*([}\]])/g, '$1') // 移除物件或陣列最後的多餘逗點
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除不可見控制字元
    .trim();

  // 5. 嘗試第一階段標準 JSON 解析
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return { items: parsed };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
      return parsed;
    }
  } catch (parseErr: any) {
    console.warn('[JSON Parse Warning] 標準 JSON 解析失敗，啟動第二階段正規表達式救援:', parseErr.message);
  }

  // 6. 第二階段：行內文字正規表達式救援提取 (Regex Fallback Parser)
  const rescuedItems: AiParsedMenuItem[] = [];
  const lines = trimmed.split('\n');
  const itemRegex = /^[\s*-]*([\u4e00-\u9fa5a-zA-Z0-9\s()（）+-_]+?)\s*[:：$＄]?\s*(\d{1,4})\s*(?:元|NT|NT\$)?$/;

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
    console.log(`[Regex Fallback Success] 透過正規表達式成功救援 ${rescuedItems.length} 道餐點！`);
    return { items: rescuedItems };
  }

  throw new Error('未能從 AI 回應中解析出標準餐點資料，請嘗試更換近距離、無反光的照片重試');
}

// 🔍 智慧金鑰診斷與可用模型探測
async function diagnoseGeminiKey(apiKey: string) {
  const startTime = Date.now();
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      cache: 'no-store',
    });

    const latency = Date.now() - startTime;

    if (!listRes.ok) {
      const errText = await listRes.text();
      let errorMsg = `Google API 回應狀態碼 ${listRes.status}`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {}

      return {
        healthy: false,
        latency,
        status: listRes.status,
        message: errorMsg,
        supportedModels: [],
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

    return {
      healthy: true,
      latency,
      status: 200,
      message: 'API Key 連線正常，授權有效！',
      supportedModels,
    };
  } catch (e: any) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      status: 500,
      message: e.message || '連線至 Google API 伺服器逾時或失敗',
      supportedModels: [],
    };
  }
}

// 🧠 呼叫 Google Gemini Vision API
async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  storeName?: string
): Promise<AiParseResponse> {
  const userPrompt = storeName
    ? `請辨識這張【${storeName}】的實體菜單圖片，解析出所有販售餐點、價格與客製化加料/甜度冰塊規格，輸出為規範的 JSON。`
    : '請辨識這張菜單圖片，解析出所有販售餐點、價格與客製化規格，輸出為規範的 JSON。';

  // 優先推薦的標準視覺模型清單
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: SYSTEM_PROMPT },
                  { text: userPrompt },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        });

        const rawResponseBody = await response.text();

        if (!response.ok) {
          let errMsg = `Google API (${model}) 回應 ${response.status}`;
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

          // 若為 404 或不支持 generateContent，嘗試下一個
          if (
            response.status === 404 ||
            rawResponseBody.includes('Interactions API') ||
            rawResponseBody.includes('not supported for generateContent')
          ) {
            console.warn(`[AI-Parse] 模型 ${model} 在端點不可用，自動切換至下一模型...`);
            continue;
          }

          throw new Error(errMsg);
        }

        // 安全解析 Google API 的 JSON 包裹層
        let parsedApiJson: any = null;
        try {
          parsedApiJson = JSON.parse(rawResponseBody);
        } catch {
          throw new Error('Google API 回傳非預期非 JSON 格式');
        }

        const candidateText = parsedApiJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error('Google API 未回傳有效的文字內容');
        }

        // 使用深度容錯提取器解析最終菜單 JSON
        const result = extractAndCleanJson(candidateText);
        if (result && Array.isArray(result.items) && result.items.length > 0) {
          return result;
        }
      } catch (e: any) {
        console.warn(`[AI-Parse] 模型 ${model} 呼叫失敗:`, e.message);
        lastError = e;
        if (e.message && e.message.includes('API Key')) {
          throw e;
        }
      }
    }
  }

  throw lastError || new Error('所有 AI 模型解析皆未能成功提取餐點，請確認圖片文字清晰且無強烈反光！');
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 1. 身分鑑權
    const token = request.cookies.get('meinu_admin_token')?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, message: '存取被拒：請先在後台完成管理者身分驗證！' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, imageBase64, mimeType = 'image/jpeg', storeName, customApiKey } = body;

    // 🔑 獲取 API 金鑰
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // 🧪 2. 支援自主健康診斷探針 (Self-Diagnostics Probe)
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

    // 🛡️ 3. 檢查圖片資料
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
            '尚未設定 Google Gemini API Key！請點擊右上角「金鑰設定」貼上您的 API Key，即可免費使用。',
        },
        { status: 400 }
      );
    }

    // 🧠 4. 呼叫視覺辨識
    const result = await callGeminiVision(imageBase64, mimeType, apiKey, storeName);

    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI 未能在圖片中識別出明確的餐點品項，請嘗試更換近距離拍攝的照片！',
        },
        { status: 422 }
      );
    }

    // 5. 標準化輸出
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
    });
  } catch (err: any) {
    console.error('[AI-Parse API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'AI 菜單解析失敗，請稍後重試',
      },
      { status: 200 } // 使用 200 讓前端安全解析 JSON 錯誤訊息，杜絕 HTML/500 崩潰
    );
  }
}
