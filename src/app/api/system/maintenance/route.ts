import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyAdminToken } from '@/lib/auth-util';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'maintenance.json');

interface MaintenanceConfig {
  is_maintenance: boolean;
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  updated_at: string;
}

const defaultConfig: MaintenanceConfig = {
  is_maintenance: false,
  title: '🚧 系統更新維護中',
  message: '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候！',
  estimated_end_time: '預計 15-30 分鐘內完成',
  reason: '系統例行升級',
  updated_at: new Date().toISOString(),
};

function readConfig(): MaintenanceConfig {
  try {
    if (fs.existsSync(configFilePath)) {
      const raw = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('讀取維護設定失敗，使用預設值', e);
  }
  return defaultConfig;
}

function writeConfig(config: MaintenanceConfig): boolean {
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('寫入維護設定失敗', e);
    return false;
  }
}

// 供前台訪客快速查詢維護狀態 (0 延遲，支援快取控制)
export async function GET() {
  const config = readConfig();
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

// 🛡️ 供團長後台控制開關與修改維護公告 (具備嚴格安全鑑權與長度防禦)
export async function POST(req: NextRequest) {
  // 1. 驗證團長認證 Token (防範未授權訪客或機器人惡意開關/竄改維護設定)
  const token = req.cookies.get('meinu_admin_token')?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { success: false, message: '🔒 存取被拒：未經授權的操作，請先解鎖團長後台！' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const current = readConfig();

    // 2. 嚴格 Payload 字串長度限制防禦 (防範惡意大型緩衝區灌水注入)
    const rawTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : current.title;
    const rawMessage = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : current.message;
    const rawEstimated =
      typeof body.estimated_end_time === 'string'
        ? body.estimated_end_time.trim().slice(0, 60)
        : current.estimated_end_time;
    const rawReason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 50) : current.reason;

    const updatedConfig: MaintenanceConfig = {
      is_maintenance: typeof body.is_maintenance === 'boolean' ? body.is_maintenance : current.is_maintenance,
      title: rawTitle,
      message: rawMessage,
      estimated_end_time: rawEstimated,
      reason: rawReason,
      updated_at: new Date().toISOString(),
    };

    const success = writeConfig(updatedConfig);
    if (!success) {
      return NextResponse.json({ success: false, message: '儲存設定失敗' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: updatedConfig.is_maintenance ? '🚧 已開啟前台系統維護模式' : '✅ 已關閉維護模式，前台恢復正常點餐',
      config: updatedConfig,
    });
  } catch (err: any) {
    console.error('更新維護狀態出錯:', err);
    return NextResponse.json({ success: false, message: err?.message || '伺服端錯誤' }, { status: 500 });
  }
}
