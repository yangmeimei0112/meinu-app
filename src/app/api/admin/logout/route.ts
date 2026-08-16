import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: '已安全登出' });
  response.cookies.delete('meinu_admin_token');
  return response;
}
