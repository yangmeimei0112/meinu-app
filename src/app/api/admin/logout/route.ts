import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: '已安全登出' });
  // 🛡️ 徹底清除 HttpOnly Cookie（包含 path 與過期屬性）
  response.cookies.set('meinu_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  });
  return response;
}
