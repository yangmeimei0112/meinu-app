import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { generateAdminToken } from '@/lib/auth-util';

// 🛡️ 智慧管理員密碼解析：優先讀取伺服端環境變數 ADMIN_PASSCODE，未設定時預設為 8888
function getVerifiedAdminPasscode(): string {
  return process.env.ADMIN_PASSCODE || process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '8888';
}

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

export async function POST(req: NextRequest) {
  const now = Date.now();
  cleanupStaleIpRecords(now);

  const ip = getClientIp(req);

  // 🛡️ 防禦 1：驗證 CSRF 同源性 (Origin 與 Host 嚴格一致性校驗)
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  if (host) {
    const hostWithoutPort = host.split(':')[0].toLowerCase();

    if (origin) {
      try {
        const originHost = new URL(origin).hostname.toLowerCase();
        if (originHost !== hostWithoutPort && originHost !== 'localhost' && originHost !== '127.0.0.1') {
          return NextResponse.json(
            { success: false, message: '跨來源請求被拒絕（CSRF 防禦已啟動）' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ success: false, message: '不合法的 Origin 標頭' }, { status: 403 });
      }
    }

    if (referer) {
      try {
        const refererHost = new URL(referer).hostname.toLowerCase();
        if (refererHost !== hostWithoutPort && refererHost !== 'localhost' && refererHost !== '127.0.0.1') {
          return NextResponse.json(
            { success: false, message: '跨來源 Referer 被拒絕（CSRF 防禦已啟動）' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ success: false, message: '不合法的 Referer 標頭' }, { status: 403 });
      }
    }
  }

  // 🛡️ 防禦 2：檢查全域分散式異常撞庫熔斷
  if (globalRateState.globalThrottleUntil > now) {
    const waitSec = Math.ceil((globalRateState.globalThrottleUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        message: `系統偵測到全站密集異常登入請求，已啟動全域防護模式。請於 ${waitSec} 秒後再試。`,
        lockedUntilSec: waitSec,
      },
      { status: 429 }
    );
  }

  // 🛡️ 防禦 3：檢查單一 IP 階梯式封鎖冷卻期
  const ipRecord = loginAttempts.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: now };
  if (ipRecord.lockedUntil > now) {
    const waitSec = Math.ceil((ipRecord.lockedUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        message: `密碼錯誤次數過多，此 IP 已被暫時鎖定！請於 ${waitSec} 秒後再試。`,
        lockedUntilSec: waitSec,
      },
      { status: 429 }
    );
  }

  // 🛡️ 防禦 4：檢查請求 Content-Type 與 Payload 長度
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      { success: false, message: '不支援的 Content-Type' },
      { status: 415 }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json({ success: false, message: '請提供有效密碼' }, { status: 400 });
    }

    // 🛡️ 防禦 5：伺服端時序安全比對 (Constant-Time String Comparison) - 杜絕時序側信道攻擊
    const verifiedPasscode = getVerifiedAdminPasscode();
    const targetBuffer = Buffer.from(verifiedPasscode);
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

    // 驗證成功：重置該 IP 錯誤計數
    loginAttempts.delete(ip);

    // 產生伺服端簽章 HMAC-SHA256 Token
    const token = generateAdminToken();

    // 🛡️ 以 HttpOnly + SameSite=Strict + Secure Cookie 寫入簽章憑證
    const response = NextResponse.json({
      success: true,
      message: '解鎖成功！',
    });

    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: 'meinu_admin_token',
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 天有效期
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('後台驗證失敗:', err);
    return NextResponse.json(
      { success: false, message: '伺服端處理錯誤，請稍候重試' },
      { status: 500 }
    );
  }
}
