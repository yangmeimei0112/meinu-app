import crypto from 'crypto';

const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY || 'meinu-super-secret-auth-key-2026';

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
