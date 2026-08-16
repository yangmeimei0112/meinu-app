/**
 * 咩nu 基礎資安防護與反機器人/反撞庫防禦工具函式庫
 */

/**
 * 清洗與跳脫使用者文字輸入，防止 XSS 攻擊與惡意腳本注入
 * @param input 原始使用者輸入字串
 * @param maxLength 最大允許長度（預設 100）
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    // 移除危險的 HTML 標籤（如 <script>, <iframe>, <object>, <embed> 等）
    .replace(/<[^>]*>?/gm, '')
    // 移除 javascript: 偽協定
    .replace(/javascript:/gi, '')
    // 移除 inline event handlers 如 onload=, onclick=
    .replace(/on\w+\s*=/gi, '')
    // 限制最大字串長度
    .slice(0, maxLength);
}

/**
 * 檢查送單速率限制與防刷單冷卻（Client-Side Rate Limiter）
 * @param key 儲存標識鍵
 * @param cooldownMs 連續點擊最小間隔（毫秒）
 * @param maxInWindow 時間窗口內最大允許送單次數
 * @param windowMs 時間窗口（毫秒）
 */
export function checkRateLimit(
  key: string = 'menu_app_order_rate_limit',
  cooldownMs: number = 3500,
  maxInWindow: number = 8,
  windowMs: number = 300000 // 5 分鐘
): { allowed: boolean; reason?: string; retryAfterSec?: number } {
  if (typeof window === 'undefined') return { allowed: true };

  const now = Date.now();
  try {
    const raw = localStorage.getItem(key);
    let timestamps: number[] = raw ? JSON.parse(raw) : [];

    // 過濾出時間窗口內的歷史紀錄
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length > 0) {
      const lastTime = timestamps[timestamps.length - 1];
      const timeSinceLast = now - lastTime;

      // 檢查短時間連點冷卻
      if (timeSinceLast < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - timeSinceLast) / 1000);
        return {
          allowed: false,
          reason: `⚠️ 操作過於頻繁，請稍候 ${waitSec} 秒後再試！`,
          retryAfterSec: waitSec,
        };
      }

      // 檢查時間窗口內最大次數
      if (timestamps.length >= maxInWindow) {
        return {
          allowed: false,
          reason: '⚠️ 5 分鐘內送單次數已達上限，請勿重複大量送單！',
          retryAfterSec: 60,
        };
      }
    }

    // 記錄本次成功通過的時間戳
    timestamps.push(now);
    localStorage.setItem(key, JSON.stringify(timestamps));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * 檢查人類操作時間閾值（防止機器人極速腳本自動填充送出）
 * @param renderTime 頁面載入時間戳
 * @param minDurationMs 最小允許的人類操作時長（預設 1200ms）
 */
export function isHumanInteractionTime(renderTime: number, minDurationMs: number = 1200): boolean {
  if (!renderTime) return false;
  return Date.now() - renderTime >= minDurationMs;
}

/**
 * 🛡️ 反撞庫攻擊：生成動態算術人機挑戰 (Math CAPTCHA)
 * 專門攔截使用自動化字典或撞庫腳本批量測試密碼的攻擊工具
 */
export function generateMathChallenge(): { question: string; answer: number } {
  const isAddition = Math.random() > 0.4;
  if (isAddition) {
    const a = Math.floor(Math.random() * 20) + 3;
    const b = Math.floor(Math.random() * 15) + 2;
    return {
      question: `${a} + ${b} = ?`,
      answer: a + b,
    };
  } else {
    const a = Math.floor(Math.random() * 25) + 15;
    const b = Math.floor(Math.random() * 12) + 1;
    return {
      question: `${a} - ${b} = ?`,
      answer: a - b,
    };
  }
}

/**
 * 🛡️ 反撞庫攻擊：計算指數級退避鎖定時間（秒）
 * @param failedCount 連續失敗次數
 */
export function getLockoutDurationSec(failedCount: number): number {
  if (failedCount >= 10) return 900; // 15 分鐘
  if (failedCount >= 7) return 300;  // 5 分鐘
  if (failedCount >= 5) return 60;   // 1 分鐘
  if (failedCount >= 3) return 30;   // 30 秒
  return 0;
}

/**
 * 人為非同步安全延遲（消除時序側信道分析，並阻斷高併發撞庫腳本）
 * @param minMs 最小毫秒
 * @param maxMs 最大毫秒
 */
export async function securityDelay(minMs: number = 350, maxMs: number = 650): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
