import type { Metadata } from 'next';
import './globals.css';

// 取得實際網站網址（Vercel 部署後的網址）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu-app.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "咩nu 揪團點餐平台",
  description: '快來看看今天想吃什麼！點擊連結選擇店家開始點餐。',
  manifest: '/manifest.json',
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
        url: '/logo.png', // 👈 自動對應 public/logo.png
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0284c7" />
        <meta name="color-scheme" content="light dark" />
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
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 antialiased selection:bg-sky-100 dark:selection:bg-sky-900/60 selection:text-sky-600 dark:selection:text-sky-300">
        <MaintenanceGuard>{children}</MaintenanceGuard>
      </body>
    </html>
  );
}