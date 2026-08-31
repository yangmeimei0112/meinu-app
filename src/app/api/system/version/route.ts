import { NextResponse } from 'next/server';
import packageJson from '../../../../../package.json';

export async function GET() {
  const commitHash =
    process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) ||
    process.env.NEXT_PUBLIC_GIT_COMMIT_HASH ||
    'dev';

  return NextResponse.json(
    {
      version: packageJson.version,
      commitHash,
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
