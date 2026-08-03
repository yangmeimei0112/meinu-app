import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import StoreClient from './StoreClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  params: Promise<{ id: string }>;
};

// 🌟 核心功能：動態生成 LINE / IG / FB 社群預覽卡片 (OG Metadata)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const storeId = resolvedParams.id;

  // 1. 從 Supabase 讀取店家資訊
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu-app.vercel.app';
  const storeName = store?.name || '熱門店家';
  const title = `【咩nu】大家揪團點「${storeName}」！`;
  const description = `今天大家想吃這個，不知道有咩有你想要點的呢?`;
  const imageUrl =
    store?.image_url || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/stores/${storeId}`,
      siteName: '咩nu (meinu) 團購點餐平台',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: storeName,
        },
      ],
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  return <StoreClient storeId={resolvedParams.id} />;
}