import fs from 'fs';
import path from 'path';
import { MaintenanceConfig, defaultMaintenanceConfig } from './maintenanceConfig';

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
