import fs from 'fs';
import path from 'path';

export type MaintenanceScope =
  | 'all'
  | 'home'
  | 'search'
  | 'stores'
  | 'cart'
  | 'checkout'
  | 'my-orders'
  | 'account'
  | 'legal';

export const VALID_SCOPES: MaintenanceScope[] = [
  'all',
  'home',
  'search',
  'stores',
  'cart',
  'checkout',
  'my-orders',
  'account',
  'legal',
];

export interface MaintenanceConfig {
  is_maintenance: boolean;
  scope?: MaintenanceScope; // 向下相容單選
  scopes?: MaintenanceScope[]; // 🌟 支援多選 / 複選單一頁面維護 (例如: ['cart', 'checkout'])
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  custom_image_url?: string;
  updated_at: string;
}

export const defaultMaintenanceConfig: MaintenanceConfig = {
  is_maintenance: false,
  scope: 'all',
  scopes: ['all'],
  title: '網站更新維護中，請稍後再下單',
  message: '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候。',
  estimated_end_time: '預計 15-30 分鐘內完成',
  reason: '系統例行升級',
  custom_image_url: '',
  updated_at: new Date().toISOString(),
};

const configFilePath = path.join(process.cwd(), 'src', 'data', 'maintenance.json');
const tmpFilePath = path.join('/tmp', 'meinu_maintenance.json');

// 伺服端記憶體持久化備援 (Serverless Memory Fallback)
let memoryCache: MaintenanceConfig | null = null;

export function readMaintenanceConfig(): MaintenanceConfig {
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

  memoryCache = defaultMaintenanceConfig;
  return memoryCache;
}

export function writeMaintenanceConfig(config: MaintenanceConfig): boolean {
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

export function getMaintenanceConfigServer(): MaintenanceConfig {
  return readMaintenanceConfig();
}
