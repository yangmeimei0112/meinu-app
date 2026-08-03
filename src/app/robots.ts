import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://meinu2.vercel.app/'; // ⚠️ 請替換為實際網址

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'], // 禁止搜尋引擎抓取後台與 API
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}