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

  // 阻擋已知惡意滲透與掃描工具
  const isMaliciousBot = BLOCKED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
  if (isMaliciousBot) {
    return new NextResponse('Access Denied - Security Rule Triggered', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，排除 Next.js 內部檔案與靜態資源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
};
