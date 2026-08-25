import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'store_codes.json');
const tmpFilePath = path.join('/tmp', 'meinu_store_codes.json');

// 伺服端記憶體快取
let memoryCache: Record<string, string> | null = null;

function readCodeMap(): Record<string, string> {
  if (memoryCache) {
    return memoryCache;
  }

  // 1. 專案內部資料夾
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      memoryCache = JSON.parse(raw);
      return memoryCache || {};
    }
  } catch {}

  // 2. /tmp 暫存
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

function writeCodeMap(data: Record<string, string>): boolean {
  memoryCache = data;
  const jsonStr = JSON.stringify(data, null, 2);

  // 1. 寫入專案路徑
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, jsonStr, 'utf8');
    return true;
  } catch {}

  // 2. 備援寫入 /tmp
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

// 標準化商家編號為 S-001 格式
export function formatStoreCode(rawInput: string | number): string {
  const digitsOnly = String(rawInput).replace(/\D/g, '');
  if (!digitsOnly) return 'S-001';
  const num = parseInt(digitsOnly, 10);
  if (isNaN(num) || num <= 0) return 'S-001';
  return `S-${String(num).padStart(3, '0')}`;
}

// GET: 取得所有店家代碼或指定店家代碼
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const codeMap = readCodeMap();

    if (storeId) {
      return NextResponse.json(
        { success: true, storeId, code: codeMap[storeId] || null },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: true, codeMap },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || '讀取店家編號失敗' },
      { status: 500 }
    );
  }
}

import { verifyAdminToken } from '@/lib/auth-util';

// POST: 儲存指定店家的編號（具備純數字正則檢驗、絕對唯一性檢查與團長安全鑑權）
export async function POST(request: NextRequest) {
  try {
    // 🛡️ 資安防護：僅限已認證登入之團長修改商家編號
    const token = request.cookies.get('meinu_admin_token')?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, message: '🔒 存取被拒：未經授權的操作，請先解鎖團長管理後台！' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { storeId, codeNumber, code } = body as {
      storeId?: string;
      codeNumber?: string | number;
      code?: string;
    };

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: '參數錯誤：缺少 storeId' },
        { status: 400 }
      );
    }

    const rawInput = codeNumber !== undefined ? codeNumber : code;
    if (rawInput === undefined || rawInput === null || String(rawInput).trim() === '') {
      return NextResponse.json(
        { success: false, message: '參數錯誤：商家編號不能為空' },
        { status: 400 }
      );
    }

    // 格式化為 S-001
    const normalizedCode = formatStoreCode(rawInput);

    // 嚴格正則驗證：必須為 S- 加上純數字
    if (!/^S-\d+$/.test(normalizedCode)) {
      return NextResponse.json(
        { success: false, message: '商家編號格式錯誤，必須為 S- 後接純數字 (例如: S-001)' },
        { status: 400 }
      );
    }

    const codeMap = readCodeMap();

    // 絕對唯一性防重檢查（排除自己）
    for (const [existingStoreId, existingCode] of Object.entries(codeMap)) {
      if (existingStoreId !== storeId && existingCode.toUpperCase() === normalizedCode.toUpperCase()) {
        return NextResponse.json(
          {
            success: false,
            message: `❌ 商家編號「${normalizedCode}」已被其他店家使用，請選擇其他編號！`,
          },
          { status: 400 }
        );
      }
    }

    codeMap[storeId] = normalizedCode;
    writeCodeMap(codeMap);

    return NextResponse.json({
      success: true,
      message: `商家編號已成功更新為 ${normalizedCode}！`,
      storeId,
      code: normalizedCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || '儲存商家編號失敗' },
      { status: 500 }
    );
  }
}
