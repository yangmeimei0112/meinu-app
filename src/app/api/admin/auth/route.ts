import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { generateAdminToken } from '@/lib/auth-util';

// 🛡️ H1 修復：移除弱密碼後備值，強制要求伺服端環境變數
// 若 ADMIN_PASSCODE 未設定，伺服端立即拋錯，確保服務不會以弱密碼啟動
const SERVER_ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;
if (!SERVER_ADMIN_PASSCODE) {
  throw new Error(
    '[FATAL] ADMIN_PASSCODE 伺服端環境變數未設定！請在 .env.local 或 Vercel Dashboard 中設定強密碼，否則管理後台將無法啟動。切勿使用 NEXT_PUBLIC_ 前綴（會洩漏至前端 Bundle）。'
  );
}
const VERIFIED_PASSCODE: string = SERVER_ADMIN_PASSCODE;

// 1. 伺服端單一 IP 速率限制記錄 (IP-based Rate Limiter)
const loginAttempts = new Map<string, { count: number; lockedUntil: number; lastAttempt: number }>();

// 2. 🛡️ 全域異常分散式撞庫防禦記錄 (Global Anomaly Rate Limiter)
// 防範駭客利用大量分散式 Proxy / Botnet 輪換 IP 繞過單一 IP 限制
interface GlobalRateState {
  failedTimestamps: number[];
  globalThrottleUntil: number;
}
const globalRateState: GlobalRateState = {
  failedTimestamps: [],
  globalThrottleUntil: 0,
};

// 定期自動清理 30 分鐘以上無活動的過期 IP 記錄，防止記憶體膨脹
function cleanupStaleIpRecords(now: number) {
  if (loginAttempts.size > 200) {
    for (const [ipKey, record] of loginAttempts.entries()) {
      if (now - record.lastAttempt > 30 * 60 * 1000 && record.lockedUntil < now) {
        loginAttempts.delete(ipKey);
      }
    }
  }

  // 清理 2 分鐘前的全域失敗時間戳
  globalRateState.failedTimestamps = globalRateState.failedTimestamps.filter(
    (t) => now - t < 120 * 1000
  );
}

// 🛡️ 多重來源真實 Client IP 解析（支援 Cloudflare, Vercel, 反向代理）
function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return '127.0.0.1';
}

// 🛡️ CSRF 來源同源性校驗 (Origin / Referer Validation)
function isValidOrigin(req: NextRequest): boolean {
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  if (!host) return true;

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  cleanupStaleIpRecords(now);

  // 🛡️ 防禦 1：CSRF 跨站偽造請求阻斷
  if (!isValidOrigin(req)) {
    return NextResponse.json(
      { success: false, message: '存取被拒：不合法的跨來源請求 (CSRF Protected)' },
      { status: 403 }
    );
  }

  // 🛡️ 防禦 2：請求大小炸彈防護 (Request Body Size Bomb Defense)
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 16384) {
    return NextResponse.json(
      { success: false, message: '請求資料過大，拒絕處理' },
      { status: 413 }
    );
  }

  // 🛡️ 防禦 3：全域分散式撞庫熔斷機制 (Global Anomaly Rate Limiting)
  if (globalRateState.globalThrottleUntil > now) {
    const globalWait = Math.ceil((globalRateState.globalThrottleUntil - now) / 1000);
    return NextResponse.json(
      { success: false, message: `系統偵測到全域高頻登入異常，全站防護冷卻中 (${globalWait} 秒)` },
      { status: 429 }
    );
  }

  const ip = getClientIp(req);

  // 🛡️ 防禦 4：單一 IP 防爆破與鎖定檢查 (IP Rate Limiting & Lockout)
  const ipRecord = loginAttempts.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: now };
  if (ipRecord.lockedUntil > now) {
    const waitSec = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    return NextResponse.json(
      { success: false, message: `嘗試次數過多，伺服端安全鎖定中，請於 ${waitSec} 秒後再試！`, lockedUntilSec: waitSec },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json({ success: false, message: '請提供有效密碼' }, { status: 400 });
    }

    // 🛡️ 防禦 5：伺服端時序安全比對 (Constant-Time String Comparison) - 杜絕時序側信道攻擊
    const targetBuffer = Buffer.from(VERIFIED_PASSCODE);
    const inputBuffer = Buffer.from(passcode.trim());
    const isMatch = targetBuffer.length === inputBuffer.length && crypto.timingSafeEqual(targetBuffer, inputBuffer);

    if (!isMatch) {
      // 記錄本次失敗至全域與單一 IP
      globalRateState.failedTimestamps.push(now);
      const nextCount = ipRecord.count + 1;
      let lockedUntil = 0;
      let waitSec = 0;

      // 檢查單一 IP 階梯式封鎖
      if (nextCount >= 5) {
        waitSec = nextCount >= 10 ? 900 : nextCount >= 7 ? 300 : 60;
        lockedUntil = now + waitSec * 1000;
      }
      loginAttempts.set(ip, { count: nextCount, lockedUntil, lastAttempt: now });

      // 檢查全域分散式撞庫閾值（60 秒內全站失敗次數超過 20 次，觸發全域 30 秒冷卻）
      const recentGlobalFails = globalRateState.failedTimestamps.filter((t) => now - t < 60 * 1000).length;
      if (recentGlobalFails >= 20) {
        globalRateState.globalThrottleUntil = now + 30 * 1000;
      }

      return NextResponse.json(
        {
          success: false,
          message: lockedUntil > 0 ? `密碼錯誤達上限！伺服端已鎖定 ${waitSec} 秒` : `密碼錯誤！(剩餘 ${Math.max(0, 5 - nextCount)} 次嘗試機會)`,
          lockedUntilSec: waitSec,
          remainingAttempts: Math.max(0, 5 - nextCount),
        },
        { status: 401 }
      );
    }

    // 🛡️ 防禦 6：驗證成功重設與簽發安全 Token
    loginAttempts.delete(ip);
    const token = generateAdminToken();

    const response = NextResponse.json({
      success: true,
      message: '驗證成功，歡迎登入團長後台',
    });

    // 寫入 HttpOnly Secure SameSite=Strict Cookie
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
