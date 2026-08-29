import crypto from 'crypto';

// 🛡️ H2 修復：移除預設值後備，強制要求環境變數存在
// 若 AUTH_SECRET_KEY 未設定，伺服器啟動時即失敗，阻止攻擊者使用已知的預設密鑰偽造 Token
const _AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY;
if (!_AUTH_SECRET_KEY) {
  throw new Error(
    '[FATAL] AUTH_SECRET_KEY 環境變數未設定！請在 .env.local (本機) 或 Vercel Dashboard (生產環境) 中設定一個至少 32 字元的強密鑰，否則服務無法啟動。'
  );
}
// 通過 guard 之後斷言為 string（TypeScript 無法自動收窄 module-scope const）
const AUTH_SECRET_KEY: string = _AUTH_SECRET_KEY;

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }
  try {
    const [timestamp, signature] = token.split('.');
    if (!timestamp || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET_KEY)
      .update(`admin_${timestamp}`)
      .digest('hex');

    // 🛡️ 密碼學恆定時間簽章校驗 (Constant-Time Verification) 杜絕時序側信道分析
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);
    const isValidSignature =
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    const tokenTime = Number(timestamp);
    if (isNaN(tokenTime) || tokenTime <= 0) return false;

    // 🛡️ 嚴格時間窗口：不接受未來時間戳（容許 60 秒時鐘微小偏差）且有效期限為 7 天
    const now = Date.now();
    const isNotFuture = tokenTime <= now + 60 * 1000;
    const isNotExpired = now - tokenTime < 7 * 24 * 60 * 60 * 1000;

    return isValidSignature && isNotFuture && isNotExpired;
  } catch {
    return false;
  }
}

export function generateAdminToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET_KEY)
    .update(`admin_${timestamp}`)
    .digest('hex');
  return `${timestamp}.${signature}`;
}
