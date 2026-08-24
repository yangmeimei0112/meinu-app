import fs from 'fs';
import path from 'path';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'store_codes.json');
const tmpFilePath = path.join('/tmp', 'meinu_store_codes.json');

// 伺服端讀取 store_codes.json 對照表
export function getStoreCodeMap(): Record<string, string> {
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(raw) || {};
    }
  } catch {}

  try {
    if (fs.existsSync(tmpFilePath)) {
      const raw = fs.readFileSync(tmpFilePath, 'utf8');
      return JSON.parse(raw) || {};
    }
  } catch {}

  return {};
}

/**
 * 🌟 核心解析函式：
 * 根據 URL 傳入的識別字（可能是 S-001, s-001, 001 或 UUID）
 * 精準解析出實際 Supabase Store UUID 與標準化的 S-??? 商家編號
 */
export function resolveStoreIdentifier(paramId: string): {
  actualStoreId: string;
  storeCode: string | null;
  isCodeParam: boolean;
} {
  const codeMap = getStoreCodeMap();
  const raw = String(paramId || '').trim();
  const upper = raw.toUpperCase();

  // 1. 傳入格式為 S-??? 或 s-??? (例如 S-001, s-001)
  if (upper.startsWith('S-')) {
    for (const [storeId, code] of Object.entries(codeMap)) {
      if (code.toUpperCase() === upper) {
        return { actualStoreId: storeId, storeCode: code, isCodeParam: true };
      }
    }
  }

  // 2. 傳入格式為純數字 (例如 001, 1 ➔ 對應 S-001)
  if (/^\d+$/.test(raw)) {
    const padded = `S-${raw.padStart(3, '0')}`;
    for (const [storeId, code] of Object.entries(codeMap)) {
      if (code.toUpperCase() === padded) {
        return { actualStoreId: storeId, storeCode: code, isCodeParam: true };
      }
    }
  }

  // 3. 傳入格式為店家 UUID (例如 a1111111-1111-1111-1111-111111111111)
  if (codeMap[raw]) {
    return { actualStoreId: raw, storeCode: codeMap[raw], isCodeParam: false };
  }

  // 4. 若無任何對應，維持原樣
  return { actualStoreId: raw, storeCode: null, isCodeParam: false };
}
