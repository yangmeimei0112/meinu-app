import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import StoreClient from './StoreClient';
import { resolveStoreIdentifier } from '@/lib/store-resolver';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  params: Promise<{ id: string }>;
};

// 🌟 核心功能：動態生成 LINE / IG / FB 社群預覽卡片 (OG Metadata)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const { actualStoreId, storeCode } = resolveStoreIdentifier(rawId);

  // 1. 從 Supabase 讀取店家資訊
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('id', actualStoreId)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://meinu-app.vercel.app';
  const storeName = store?.name || '熱門店家';
  const displayCode = storeCode ? ` [${storeCode}]` : '';
  const title = `【咩nu】大家揪團點「${storeName}${displayCode}」！`;
  const description = `今天大家想吃這個，不知道有咩有你想要點的呢?`;
  const imageUrl =
    store?.image_url || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/stores/${storeCode || actualStoreId}`,
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
  const rawId = resolvedParams.id;
  const { actualStoreId, storeCode, isCodeParam } = resolveStoreIdentifier(rawId);

  // 🚀 若使用者存取的是舊版 UUID 網址，自動 307 導向至全新的標準化 S-??? 網址 (例如: /stores/S-001)
  if (!isCodeParam && storeCode) {
    redirect(`/stores/${storeCode}`);
  }

  return (
    <StoreClient
      storeId={actualStoreId}
      initialStoreCode={storeCode || (rawId.toUpperCase().startsWith('S-') ? rawId.toUpperCase() : undefined)}
    />
  );
}