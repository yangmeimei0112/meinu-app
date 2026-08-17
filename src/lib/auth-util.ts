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

    // 密碼學校驗簽章與 7 天有效期
    const isValidSignature = signature === expectedSignature;
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
