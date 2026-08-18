import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitCommitHash(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

function getGitCommitMsg(): string {
  if (process.env.VERCEL_GIT_COMMIT_MESSAGE) {
    return process.env.VERCEL_GIT_COMMIT_MESSAGE;
  }
  try {
    return execSync("git log -1 --pretty=%B").toString().trim();
  } catch {
    return "咩nu 團購點餐平台";
  }
}

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https:;
  style-src 'self' 'unsafe-inline' https:;
  img-src 'self' blob: data: https:;
  font-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  media-src 'self' blob: data:;
  frame-src 'self';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_GIT_COMMIT_HASH: getGitCommitHash(),
    NEXT_PUBLIC_GIT_COMMIT_MSG: getGitCommitMsg(),
  },
  // 🛡️ HTTP 資安防護標頭配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
