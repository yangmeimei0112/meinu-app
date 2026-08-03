import type { Metadata } from 'next';
import './globals.css';

// 取得實際網站網址（Vercel 部署後的網址）
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu-app.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Today's Order 咩nu 團購點餐平台",
  description: '快來看看今天想吃什麼！點擊連結選擇餐廳開始點餐。',
  manifest: '/manifest.json',
  openGraph: {
    title: "Today's Order 咩nu 團購點餐平台",
    description: '快來看看今天想吃什麼！點擊連結選擇餐廳開始點餐。',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <meta name="theme-color" content="#0284c7" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="bg-slate-50 antialiased selection:bg-sky-100 selection:text-sky-600">
        {children}
      </body>
    </html>
  );
}