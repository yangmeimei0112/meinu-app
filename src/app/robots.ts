import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu2.vercel.app').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'], // 保護後台管理與 API 端點不被搜尋引擎爬取
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}