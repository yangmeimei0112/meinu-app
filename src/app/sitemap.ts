import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu2.vercel.app').replace(/\/$/, '');

  // 1. 核心靜態頁面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/my-orders`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ];

  // 2. 動態店家菜單頁面 (從 Supabase 取得所有上架店家)
  let storeRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: stores } = await supabase
      .from('stores')
      .select('id, is_active')
      .eq('is_active', true);

    if (stores && stores.length > 0) {
      storeRoutes = stores.map((store) => ({
        url: `${siteUrl}/stores/${store.id}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }));
    }
  } catch (e) {
    console.error('Sitemap dynamic store fetch error:', e);
  }

  return [...staticRoutes, ...storeRoutes];
}