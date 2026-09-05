import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminToken } from '@/lib/auth-util';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'menu_order.json');
const tmpFilePath = path.join('/tmp', 'meinu_menu_order.json');

// 伺服端記憶體快取 (Serverless Memory Cache)
let memoryCache: Record<string, string[]> | null = null;

function readOrderMap(): Record<string, string[]> {
  if (memoryCache) {
    return memoryCache;
  }

  // 1. 優先嘗試讀取專案內部資料夾
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      memoryCache = JSON.parse(raw);
      return memoryCache || {};
    }
  } catch {}

  // 2. 嘗試讀取 /tmp 暫存路徑
  try {
    if (fs.existsSync(tmpFilePath)) {
      const raw = fs.readFileSync(tmpFilePath, 'utf8');
      memoryCache = JSON.parse(raw);
      return memoryCache || {};
    }
  } catch {}

  memoryCache = {};
  return memoryCache;
}

function writeOrderMap(data: Record<string, string[]>): boolean {
  memoryCache = data;
  const jsonStr = JSON.stringify(data, null, 2);

  // 1. 嘗試寫入專案路徑
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, jsonStr, 'utf8');
    return true;
  } catch {}

  // 2. 備援寫入 /tmp 暫存
  try {
    const tmpDir = path.dirname(tmpFilePath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(tmpFilePath, jsonStr, 'utf8');
    return true;
  } catch {}

  return false;
}

// GET: 讀取指定店家或全部店家的菜單排序
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const orderMap = readOrderMap();

    if (storeId) {
      return NextResponse.json(
        { success: true, storeId, itemIds: orderMap[storeId] || [] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: true, orderMap },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || '讀取菜單排序失敗' },
      { status: 500 }
    );
  }
}

// POST: 儲存指定店家的菜單品項排序清單（具備團長身分鑑權保護）
export async function POST(request: NextRequest) {
  try {
    // 🛡️ DoS / 大型 Payload 炸彈防禦
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 16384) {
      return NextResponse.json(
        { success: false, message: '請求資料過大，拒絕處理 (Payload Too Large)' },
        { status: 413 }
      );
    }

    // 🛡️ 資安防護：僅限已認證登入之團長修改菜單排序
    const token = request.cookies.get('meinu_admin_token')?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, message: '存取被拒：未經授權的操作，請先解鎖團長管理後台！' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeId, itemIds } = body as { storeId?: string; itemIds?: string[] };

    if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0 || storeId.length > 64) {
      return NextResponse.json(
        { success: false, message: '參數錯誤：無效的 storeId' },
        { status: 400 }
      );
    }

    if (!Array.isArray(itemIds) || itemIds.length > 500) {
      return NextResponse.json(
        { success: false, message: '參數錯誤：無效或超長之 itemIds 清單' },
        { status: 400 }
      );
    }

    // 🛡️ 防禦：過濾非純字串元素與超長 ID，防止型別混淆與 Prototype 注入
    const cleanItemIds = itemIds
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0 && id.length <= 64)
      .map((id) => id.trim());

    const cleanStoreId = storeId.trim();
    const orderMap = readOrderMap();
    orderMap[cleanStoreId] = cleanItemIds;
    writeOrderMap(orderMap);

    return NextResponse.json({
      success: true,
      message: '菜單排序已成功更新！',
      storeId,
      itemIds,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || '儲存菜單排序失敗' },
      { status: 500 }
    );
  }
}
