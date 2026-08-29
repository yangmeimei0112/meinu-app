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

// 需要邊緣保護的 Admin 路由
const PROTECTED_ADMIN_PATHS = ['/admin'];

export function proxy(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const { pathname } = request.nextUrl;

  // 1. 🛡️ 阻擋已知惡意滲透與掃描工具 User-Agent
  const isMaliciousBot = BLOCKED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
  if (isMaliciousBot) {
    return new NextResponse('Access Denied - Security Rule Triggered', { status: 403 });
  }

  // 2. 🛡️ H3 修復：/admin 路由邊緣節點安全防護 (Edge Admin Protection)
  // 在 Edge Runtime 攔截所有訪問 /admin 的非 API 請求
  const isProtectedAdminPage = PROTECTED_ADMIN_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedAdminPage && !pathname.startsWith('/api/')) {
    const adminToken = request.cookies.get('meinu_admin_token')?.value;

    // 若未攜帶 Token 或格式不合法，在邊緣節點直接執行 HTTP 307 重定向至首頁，禁止加載後台組件與代碼
    if (!adminToken || !adminToken.includes('.') || adminToken.split('.').length !== 2) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('from', 'admin');

      const response = NextResponse.redirect(redirectUrl);
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      if (adminToken) {
        response.cookies.delete('meinu_admin_token');
      }
      return response;
    }
  }

  const response = NextResponse.next();

  // 3. 🛡️ 注入全域 HTTP 安全防禦標頭 (Security Headers)
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
