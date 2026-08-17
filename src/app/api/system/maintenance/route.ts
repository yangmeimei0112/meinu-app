import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// 供團長後台控制開關與修改維護公告
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readConfig();

    const updatedConfig: MaintenanceConfig = {
      is_maintenance: typeof body.is_maintenance === 'boolean' ? body.is_maintenance : current.is_maintenance,
      title: body.title && typeof body.title === 'string' ? body.title.trim() : current.title,
      message: body.message && typeof body.message === 'string' ? body.message.trim() : current.message,
      estimated_end_time:
        typeof body.estimated_end_time === 'string' ? body.estimated_end_time.trim() : current.estimated_end_time,
      reason: typeof body.reason === 'string' ? body.reason.trim() : current.reason,
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
