import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-util';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('meinu_admin_token')?.value;

  if (verifyAdminToken(token)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
