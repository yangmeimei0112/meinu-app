import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-util';
import { AiParseResponse } from './types';
import { callGeminiVision, runDiagnostics } from './geminiVisionService';

export * from './types';

export async function POST(request: NextRequest) {
  try {
    // 1. 驗證管理員 Token
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

    // 2. 自主連線診斷處理
    if (action === 'diagnose') {
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          needsApiKey: true,
          message: '尚未設定 API Key，請先貼上金鑰後再執行診斷！',
        });
      }
      const diagResult = await runDiagnostics(apiKey);
      return NextResponse.json({
        success: diagResult.healthy,
        diagnosis: diagResult,
      });
    }

    // 3. 檢查圖片輸入
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

    // 4. 呼叫 Gemini Vision 視覺模型
    const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const { result, trace } = await callGeminiVision(imageBase64, mimeType, cleanKey, storeName);

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

    // 5. 格式化識別結果供前台預覽與批次匯入
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
      data: { items: sanitizedItems },
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
