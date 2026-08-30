import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminToken } from '@/lib/auth-util';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'maintenance.json');
const tmpFilePath = path.join('/tmp', 'meinu_maintenance.json');

export type MaintenanceScope = 'all' | 'home' | 'search' | 'stores' | 'cart' | 'checkout' | 'my-orders';

export interface MaintenanceConfig {
  is_maintenance: boolean;
  scope?: MaintenanceScope; // 'all' (全站) | 'home' | 'search' | 'stores' | 'cart' | 'checkout' | 'my-orders'
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  custom_image_url?: string;
  updated_at: string;
}

const defaultConfig: MaintenanceConfig = {
  is_maintenance: false,
  scope: 'all',
  title: '網站更新維護中，請稍後再下單',
  message: '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候。',
  estimated_end_time: '預計 15-30 分鐘內完成',
  reason: '系統例行升級',
  custom_image_url: '',
  updated_at: new Date().toISOString(),
};

// 伺服端記憶體持久化備援 (Serverless Memory Fallback)
let memoryCache: MaintenanceConfig | null = null;

function readConfig(): MaintenanceConfig {
  if (memoryCache) {
    return memoryCache;
  }

  // 1. 優先嘗試讀取專案路徑檔案
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      memoryCache = JSON.parse(raw);
      return memoryCache!;
    }
  } catch {}

  // 2. 備援嘗試讀取 /tmp 暫存路徑 (Serverless 寫入相容)
  try {
    if (fs.existsSync(tmpFilePath)) {
      const raw = fs.readFileSync(tmpFilePath, 'utf8');
      memoryCache = JSON.parse(raw);
      return memoryCache!;
    }
  } catch {}

  memoryCache = defaultConfig;
  return memoryCache;
}

function writeConfig(config: MaintenanceConfig): boolean {
  memoryCache = config;

  let written = false;

  // 1. 嘗試寫入專案路徑
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    written = true;
  } catch {}

  // 2. 若專案路徑為 Read-Only (如 Vercel 生產環境)，備援寫入 /tmp 暫存
  try {
    fs.writeFileSync(tmpFilePath, JSON.stringify(config, null, 2), 'utf8');
    written = true;
  } catch {}

  return written || !!memoryCache;
}

const VALID_SCOPES: MaintenanceScope[] = ['all', 'home', 'search', 'stores', 'cart', 'checkout', 'my-orders'];

// 供前台訪客快速查詢維護狀態與生效範圍
export async function GET() {
  const config = readConfig();

  return NextResponse.json(
    {
      is_maintenance: config.is_maintenance,
      scope: config.is_maintenance ? (config.scope || 'all') : 'all',
      title: config.is_maintenance ? config.title : '',
      message: config.is_maintenance ? config.message : '',
      estimated_end_time: config.is_maintenance ? (config.estimated_end_time || '') : '',
      reason: config.is_maintenance ? (config.reason || '') : '',
      custom_image_url: config.is_maintenance ? (config.custom_image_url || '') : '',
      updated_at: config.updated_at,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

// 🛡️ 供團長後台控制開關與修改維護公告 (具備嚴格安全鑑權與長度防禦)
export async function POST(req: NextRequest) {
  // 1. 驗證 CSRF 同源性
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  if (host && origin) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ success: false, message: '跨來源請求被拒' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, message: '不合法的請求來源' }, { status: 403 });
    }
  }

  // 2. 驗證團長認證 Token (防範未授權訪客或機器人惡意開關/竄改維護設定)
  const token = req.cookies.get('meinu_admin_token')?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { success: false, message: '存取被拒：未經授權的操作，請先解鎖團長後台！' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const current = readConfig();

    // 3. 嚴格 Payload 字串長度限制與協議防禦
    const rawTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : current.title;
    const rawMessage = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : current.message;
    const rawEstimated =
      typeof body.estimated_end_time === 'string'
        ? body.estimated_end_time.trim().slice(0, 60)
        : current.estimated_end_time;
    const rawReason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 50) : current.reason;

    // 4. 維護範圍校驗 (預設為 'all')
    const rawScope: MaintenanceScope = VALID_SCOPES.includes(body.scope) ? body.scope : (current.scope || 'all');
    
    let rawCustomImage = current.custom_image_url || '';
    if (typeof body.custom_image_url === 'string') {
      const imgCandidate = body.custom_image_url.trim();
      // 僅允許標準 HTTP(S) 或 data:image/ 安全協議，封鎖 javascript: 或其他危險偽協定
      if (!imgCandidate || /^https?:\/\//i.test(imgCandidate) || /^data:image\//i.test(imgCandidate)) {
        rawCustomImage = imgCandidate.slice(0, 500000); // 允許 Base64 圖片但限制最大長度
      }
    }

    const updatedConfig: MaintenanceConfig = {
      is_maintenance: typeof body.is_maintenance === 'boolean' ? body.is_maintenance : current.is_maintenance,
      scope: rawScope,
      title: rawTitle,
      message: rawMessage,
      estimated_end_time: rawEstimated,
      reason: rawReason,
      custom_image_url: rawCustomImage,
      updated_at: new Date().toISOString(),
    };

    const success = writeConfig(updatedConfig);
    if (!success) {
      return NextResponse.json({ success: false, message: '儲存設定失敗' }, { status: 500 });
    }

    const scopeLabels: Record<MaintenanceScope, string> = {
      all: '全站所有頁面',
      home: '首頁大廳',
      search: '探索搜尋頁',
      stores: '店家菜單頁',
      cart: '購物車頁',
      checkout: '結帳送單頁',
      'my-orders': '歷史訂單頁',
    };

    return NextResponse.json({
      success: true,
      message: updatedConfig.is_maintenance
        ? `已開啟「${scopeLabels[rawScope] || '特定頁面'}」系統維護模式`
        : '已關閉維護模式，前台恢復正常點餐',
      config: updatedConfig,
      build_id: process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
    });
  } catch (err: any) {
    console.error('更新維護狀態出錯:', err);
    return NextResponse.json({ success: false, message: err?.message || '伺服端錯誤' }, { status: 500 });
  }
}
