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
      "price": 50, // 基本單價 (number, 必填)
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

// 🔍 動態探測該 API Key 支援的 Gemini 模型清單
async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (Array.isArray(listData.models)) {
        const supported = listData.models
          .filter((m: any) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m: any) => m.name.replace(/^models\//, ''));

        // 依推薦順序排序
        const preference = [
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-2.0-flash-exp',
          'gemini-1.5-flash-8b',
          'gemini-1.5-pro',
          'gemini-1.5-pro-latest',
        ];

        const sorted = preference.filter((p) => supported.includes(p));
        // 加入其他支援的模型
        for (const name of supported) {
          if (!sorted.includes(name)) {
            sorted.push(name);
          }
        }

        if (sorted.length > 0) {
          return sorted;
        }
      }
    } else {
      const errText = await listRes.text();
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.message) {
          const msg = errJson.error.message;
          if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
            throw new Error('填入的 Google Gemini API Key 無效，請檢查是否複製完整！');
          }
          if (msg.includes('PERMISSION_DENIED') || msg.includes('has not used the API')) {
            throw new Error(`Google API 權限被拒：${msg}，請確認專案已啟用 Generative Language API。`);
          }
        }
      } catch (parseErr: any) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
  } catch (e: any) {
    if (e.message && (e.message.includes('API Key') || e.message.includes('Google API 權限'))) {
      throw e;
    }
    console.warn('[AI-Parse] 動態取得模型清單失敗，使用預設備援模型清單:', e.message);
  }

  // 兜底預設清單
  return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp'];
}

// 🧠 呼叫 Google Gemini Vision API
async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  storeName?: string
): Promise<AiParseResponse> {
  const models = await getAvailableGeminiModels(apiKey);
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const userPrompt = storeName
        ? `請辨識這張【${storeName}】的實體菜單圖片，解析出所有販售餐點、價格與客製化加料/甜度冰塊規格，輸出為規範的 JSON。`
        : '請辨識這張菜單圖片，解析出所有販售餐點、價格與客製化規格，輸出為規範的 JSON。';

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

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = `Gemini API (${model}) 錯誤 (${response.status}): ${errorText}`;
        try {
          const errJson = JSON.parse(errorText);
          if (errJson?.error?.message) {
            errMsg = errJson.error.message;
            if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
              throw new Error('填入的 Google Gemini API Key 無效，請檢查是否複製完整！');
            }
          }
        } catch (jsonErr: any) {
          if (jsonErr.message && jsonErr.message.includes('API Key')) throw jsonErr;
        }

        // 若為 404 (該模型名稱不支援)，嘗試下一個可用模型
        if (response.status === 404) {
          console.warn(`[AI-Parse] 模型 ${model} 不支援 generateContent，嘗試下一個...`);
          continue;
        }

        throw new Error(errMsg);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini API 未回傳有效的文字內容');
      }

      // 清理 JSON 前後可能包裹的 markdown 標記
      const cleanJsonStr = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed: AiParseResponse = JSON.parse(cleanJsonStr);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    } catch (e: any) {
      console.warn(`[AI-Parse] 模型 ${model} 呼叫失敗:`, e.message);
      lastError = e;
      if (e.message && e.message.includes('API Key')) {
        throw e;
      }
    }
  }

  throw lastError || new Error('所有 Gemini 模型解析皆失敗，請檢查 API Key 或圖片清晰度');
}


// 🧠 呼叫 OpenAI Vision API (備援)
async function callOpenAiVision(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  storeName?: string
): Promise<AiParseResponse> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API 錯誤 (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error('OpenAI API 未回傳內容');
  }

  const parsed: AiParseResponse = JSON.parse(rawText);
  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ 1. 身分鑑權：僅允許已解鎖管理後台之團長呼叫
    const token = request.cookies.get('meinu_admin_token')?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, message: '存取被拒：請先在後台完成管理者身分驗證！' },
        { status: 401 }
      );
    }

    // 🛡️ 2. 解析請求資料
    const body = await request.json();
    const { imageBase64, mimeType = 'image/jpeg', storeName, customApiKey, provider = 'gemini' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '未接收到有效的菜單圖片 Base64 資料' },
        { status: 400 }
      );
    }

    // 🔑 3. 獲取 API 金鑰（優先順序：前端自訂 > .env.local GEMINI_API_KEY > OPENAI_API_KEY）
    const geminiKey = customApiKey || process.env.GEMINI_API_KEY;
    const openAiKey = customApiKey || process.env.OPENAI_API_KEY;

    let result: AiParseResponse;

    if (provider === 'openai' && openAiKey) {
      result = await callOpenAiVision(imageBase64, mimeType, openAiKey, storeName);
    } else if (geminiKey) {
      result = await callGeminiVision(imageBase64, mimeType, geminiKey, storeName);
    } else if (openAiKey) {
      result = await callOpenAiVision(imageBase64, mimeType, openAiKey, storeName);
    } else {
      return NextResponse.json(
        {
          success: false,
          needsApiKey: true,
          message:
            '尚未設定 AI API Key！請在後台掃描視窗中點擊「金鑰設定」填入 Google Gemini API Key，或在伺服端 .env.local 設定 GEMINI_API_KEY。',
        },
        { status: 400 }
      );
    }

    // 🛡️ 4. 驗證並格式化品項清單
    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI 未能在圖片中識別出明確的餐點品項，請嘗試更換較清晰、光線充足或近距離拍攝的照片！',
        },
        { status: 422 }
      );
    }

    // 標準化整理品項資料
    const sanitizedItems = result.items.map((item, idx) => ({
      tempId: `ai_item_${Date.now()}_${idx}`,
      name: String(item.name || `未命名餐點 ${idx + 1}`).trim(),
      price: Math.max(0, Number(item.price) || 0),
      description: item.description ? String(item.description).trim() : '',
      category: item.category ? String(item.category).trim() : (result.category_name || '精選推薦'),
      is_sold_out: Boolean(item.is_sold_out),
      custom_groups: Array.isArray(item.custom_groups)
        ? item.custom_groups.map((cg, cgIdx) => ({
            id: `cg_${Date.now()}_${cgIdx}`,
            title: String(cg.title || '規格選項').trim(),
            type: cg.type === 'multiple' ? 'multiple' : 'single',
            options: Array.isArray(cg.options)
              ? cg.options.map((opt, optIdx) => ({
                  id: `opt_${Date.now()}_${cgIdx}_${optIdx}`,
                  name: String(opt.name || '預設選項').trim(),
                  price: Math.max(0, Number(opt.price) || 0),
                  is_default: Boolean(opt.is_default),
                }))
              : [],
          }))
        : [],
      selected: true, // 前端預設勾選
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
      { status: 500 }
    );
  }
}
