import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

// 伺服端專用密鑰（優先讀取伺服端環境變數 ADMIN_PASSCODE，不外洩給前端）
const SERVER_ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '8888';
const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY || 'meinu-super-secret-auth-key-2026';

// 伺服端記憶體速率限制記錄 (IP-based Rate Limiter)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
}

function generateSecureToken(): string {
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', AUTH_SECRET_KEY).update(`admin_${timestamp}`).digest('hex');
  return `${timestamp}.${signature}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();

  // 1. 伺服端防爆破與防撞庫檢查 (IP Rate Limiting & Lockout)
  const ipRecord = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  if (ipRecord.lockedUntil > now) {
    const waitSec = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    return NextResponse.json(
      { success: false, message: `🔒 嘗試次數過多，伺服端安全鎖定中，請於 ${waitSec} 秒後再試！`, lockedUntilSec: waitSec },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json({ success: false, message: '請提供有效密碼' }, { status: 400 });
    }

    // 2. 伺服端時序安全比對 (Constant-Time String Comparison) - 杜絕時序側信道攻擊
    const targetBuffer = Buffer.from(SERVER_ADMIN_PASSCODE);
    const inputBuffer = Buffer.from(passcode.trim());
    const isMatch = targetBuffer.length === inputBuffer.length && crypto.timingSafeEqual(targetBuffer, inputBuffer);

    if (!isMatch) {
      const nextCount = ipRecord.count + 1;
      let lockedUntil = 0;
      let waitSec = 0;

      if (nextCount >= 5) {
        waitSec = nextCount >= 10 ? 900 : nextCount >= 7 ? 300 : 60;
        lockedUntil = now + waitSec * 1000;
      }

      loginAttempts.set(ip, { count: nextCount, lockedUntil });

      return NextResponse.json(
        {
          success: false,
          message: lockedUntil > 0 ? `🚫 密碼錯誤達上限！伺服端已鎖定 ${waitSec} 秒` : `❌ 密碼錯誤！(剩餘 ${Math.max(0, 5 - nextCount)} 次嘗試機會)`,
          lockedUntilSec: waitSec,
          remainingAttempts: Math.max(0, 5 - nextCount),
        },
        { status: 401 }
      );
    }

    // 3. 驗證成功：重設嘗試次數，簽發安全 Session Token
    loginAttempts.delete(ip);
    const token = generateSecureToken();

    const response = NextResponse.json({
      success: true,
      message: '✅ 驗證成功，歡迎登入團長後台',
    });

    // 寫入 HttpOnly Secure Cookie
    response.cookies.set('meinu_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 天有效期
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('伺服端登入鑑權失敗:', err);
    return NextResponse.json({ success: false, message: '伺服端錯誤' }, { status: 500 });
  }
}
