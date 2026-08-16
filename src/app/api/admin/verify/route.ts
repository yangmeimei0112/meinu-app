import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY || 'meinu-super-secret-auth-key-2026';

function verifyToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [timestamp, signature] = token.split('.');
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET_KEY).update(`admin_${timestamp}`).digest('hex');

  // 驗證簽名正確性與過期時間（7天）
  const isValidSignature = signature === expectedSignature;
  const isNotExpired = Date.now() - Number(timestamp) < 7 * 24 * 60 * 60 * 1000;
  return isValidSignature && isNotExpired;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('meinu_admin_token')?.value;

  if (verifyToken(token)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
