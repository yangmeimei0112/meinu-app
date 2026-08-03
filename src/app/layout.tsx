import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu2.vercel.app/';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '咩nu (meinu) - 隨手揪團點餐平台 | meiun-app meinu2',
    template: '%s | 咩nu (meinu)',
  },
  description: '咩nu (meinu / meinu2 / meiun-app) 是一個免費的手機揪團點餐平台，提供飲料、便當等店家菜單，隨手點餐、輕鬆對帳湊免運！',
  keywords: ['咩nu', 'meinu', 'meinu2', 'meiun-app', '咩nu點餐', '揪團點餐', '點餐平台'],
  authors: [{ name: '咩nu Team' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '咩nu (meinu) - 隨手揪團點餐平台',
    description: '快來看看今天想吃什麼！點擊連結選擇餐廳開始點餐。',
    url: siteUrl,
    siteName: '咩nu (meinu)',
    locale: 'zh_TW',
    type: 'website',
  },
  verification: {
    // ⚠️ 這裡的 HTML 驗證碼等一下在 Google Search Console 取得後填入
    google: '你的_Google_Search_Console驗證碼',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="bg-slate-50 antialiased">{children}</body>
    </html>
  );
}