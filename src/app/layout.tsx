import type { Metadata, Viewport } from 'next';
import './globals.css';

// 取得實際網站網址（Vercel 部署後的網址）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu-app.vercel.app';

// 🍎 iOS & Android 視口與全螢幕 Safe Area 深度適配
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0284c7' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f17' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // 關鍵：確保 iOS Safari 支援全螢幕 Safe Area Insets
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "咩nu 揪團點餐平台",
  description: '快來看看今天想吃什麼！點擊連結選擇店家開始點餐。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '咩nu 揪團點餐',
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "咩nu 揪團點餐平台",
    description: '快來看看今天想吃什麼！點擊連結選擇店家開始點餐。',
    url: siteUrl,
    siteName: '咩nu (meinu)',
    locale: 'zh_TW',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: '咩nu 團購點餐平台 LOGO',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today's Order 咩nu 團購點餐平台",
    description: '快来看看今天想吃什麼！點擊連結選擇餐廳開始點餐。',
    images: ['/logo.png'],
  },
};

import MaintenanceGuard from '@/components/MaintenanceGuard';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('menu_app_theme');
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  // 偵測 iOS 與 Android 並注入 class
                  var ua = navigator.userAgent || '';
                  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                  var isAndroid = /Android/i.test(ua);
                  if (isIOS) document.documentElement.classList.add('is-ios');
                  if (isAndroid) document.documentElement.classList.add('is-android');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 antialiased selection:bg-sky-100 dark:selection:bg-sky-900/60 selection:text-sky-600 dark:selection:text-sky-300 min-h-[100dvh] flex flex-col">
        <MaintenanceGuard>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <MobileBottomNav />
        </MaintenanceGuard>
      </body>
    </html>
  );
}