/**
 * 🛡️ M5 修復：清洗使用者文字輸入，防止 XSS 攻擊與惡意腳本注入
 * 改採「拒絕危險字符」而非「嘗試替換標籤」策略，避免 regex 被 Unicode 等效字符繞過
 * @param input 原始使用者輸入字串
 * @param maxLength 最大允許長度（預設 100）
 */
export function sanitizeInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    // 移除 Null Byte 與隱藏控制字元（防範字串截斷攻擊）
    .replace(/[\0\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 🛡️ M5 修復：直接移除所有 < > 字符（ASCII 及 Unicode 等效），
    // 比嘗試 regex 匹配完整標籤更安全，根本上阻斷 HTML 注入
    .replace(/[<>]/g, '')
    // 移除 Unicode 的 HTML angle bracket 等效字符
    .replace(/[\u003C\u003E\uFE64\uFE65\uFF1C\uFF1E]/g, '')
    // 移除 javascript: / vbscript: / data: 偽協定
    .replace(/(javascript|vbscript|data):/gi, '')
    // 移除 inline event handlers 如 onload=, onclick=, onerror=
    .replace(/on\w+\s*=/gi, '')
    // 移除反斜線轉義嘗試
    .replace(/\\+/g, '')
    // 限制最大字串長度
    .slice(0, maxLength);
}

/**
 * 🛡️ 驗證外部圖片或轉址 URL 是否安全（防止 javascript:, SSRF 偽協定或雲端元數據攻擊）
 * @param url 待檢查網址
 */
export function isSafeUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // 封鎖危險協議與偽協議
  if (/^(javascript|vbscript|file|ftp|data(?!:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,)):/i.test(trimmed)) {
    return false;
  }

  // 封鎖雲端內部元數據與危險 Link-Local SSRF 靶點 (如 169.254.169.254, 0.0.0.0 等)
  if (/^https?:\/\/(169\.254\.\d+\.\d+|0\.0\.0\.0|metadata\.google\.internal)/i.test(trimmed)) {
    return false;
  }

  // 允許合法的 data:image base64
  if (/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }

  // 允許標準 HTTP(S) 安全協議
  return /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/i.test(trimmed);
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
          reason: `操作過於頻繁，請稍候 ${waitSec} 秒後再試！`,
          retryAfterSec: waitSec,
        };
      }

      // 檢查時間窗口內最大次數
      if (timestamps.length >= maxInWindow) {
        return {
          allowed: false,
          reason: '5 分鐘內送單次數已達上限，請勿重複大量送單！',
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
