import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 已知惡意掃描器與機器人關鍵字特徵
const BLOCKED_BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /wprecon/i,
  /acunetix/i,
  /havij/i,
  /nmap/i,
  /zgrab/i,
  /dirbuster/i,
  /gobuster/i,
];

export function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';

  // 1. 阻擋已知惡意滲透與掃描工具 User-Agent
  const isMaliciousBot = BLOCKED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
  if (isMaliciousBot) {
    return new NextResponse('Access Denied - Security Rule Triggered', { status: 403 });
  }

  const response = NextResponse.next();

  // 2. 注入全域 HTTP 安全防禦標頭 (Security Headers)
  // 防範點擊劫持 (Clickjacking)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // 防範 MIME 類型混淆攻擊 (MIME Sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 跨來源參照隱私保護
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 嚴格限定瀏覽器設備硬體權限
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 跨站 XSS 防護
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，排除 Next.js 內部檔案與靜態資源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
};
