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

    const isNotExpired = Date.now() - Number(timestamp) < 7 * 24 * 60 * 60 * 1000;

    return isValidSignature && isNotExpired;
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
