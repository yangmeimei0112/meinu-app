'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import LiveOrderCounter from '@/components/LiveOrderCounter';
import { supabase } from '@/lib/supabase';
import { Store, Category } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import { useTheme } from '@/lib/theme';
import HomeWelcomeBanner from '@/components/HomeWelcomeBanner';
import { formatVersionDisplay } from '@/lib/formatVersion';
import { Search, ChevronRight, Store as StoreIcon, Sun, Moon } from 'lucide-react';
import { stripEmojis } from '@/lib/icon-utils';
import {
  idlePrefetchQueue,
  prefetchStoreData,
  initGlobalRealtimeCache,
  getAppIndexCache,
  setAppIndexCache,
} from '@/lib/storeMenuCache';

// 首頁店家列表骨架屏（Skeleton UI）
function StoreCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-3.5 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-20" />
      </div>
      <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 shrink-0" />
    </div>
  );
}

export default function HomePage() {
  const initialIndex = getAppIndexCache();
  const [categories, setCategories] = useState<Category[]>(initialIndex?.categories || []);
  const [stores, setStores] = useState<Store[]>(initialIndex?.stores || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(!initialIndex);
  const { theme, toggleTheme } = useTheme();

  // 搜尋關鍵字輕量防抖，避免高頻輸入時造成卡頓
  const debouncedSearch = useDebounce(searchQuery, 200);

  // 取得環境變數中的 Git 資訊（若無則顯示預設字串）
  const commitMsg = process.env.NEXT_PUBLIC_GIT_COMMIT_MSG || '咩nu 團購點餐平台';
  const commitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'v1.0.0';

  // 🌟 初始化全域 Realtime 快取監聽器
  useEffect(() => {
    const unsub = initGlobalRealtimeCache();
    return unsub;
  }, []);

  useEffect(() => {
    async function fetchData() {
      const hasCache = !!getAppIndexCache();
      if (!hasCache) setLoading(true);

      // 並行發送查詢，消除網路請求瀑布流延遲
      const [catRes, storeRes, codeRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active')
          .eq('is_active', true),
        fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      const catList = (catRes.data as Category[]) || [];
      setCategories(catList);

      if (storeRes.data) {
        const rawStores = storeRes.data as Store[];
        const codeMap: Record<string, string> = codeRes?.codeMap || {};
        const formatted = rawStores.map((s) => ({
          ...s,
          code: codeMap[s.id] || 'S-001',
        }));
        setStores(formatted);

        // 寫入全域 AppIndex 快取供搜尋頁與全站秒開使用
        setAppIndexCache({
          categories: catList,
          stores: formatted,
          codeMap,
          timestamp: Date.now(),
        });

        // 🌟 核心升級：排定 CPU 閒置期背景漸進預抓店家菜單 JSON
        const activeStoreIds = formatted.map((s) => s.id);
        idlePrefetchQueue.enqueue(activeStoreIds);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // 記憶化店家篩選結果 (支援店名與 S-??? 編號即時搜尋)
  const filteredStores = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return stores.filter((store: Store) => {
      const matchesCategory =
        selectedCategory === 'all' || store.category_id === selectedCategory;
      const matchesSearch =
        !query ||
        store.name.toLowerCase().includes(query) ||
        (store.code && store.code.toLowerCase().includes(query)) ||
        (store.code && store.code.replace(/\D/g, '').includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [stores, selectedCategory, debouncedSearch]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <OfflineBanner />
        <Header />

        <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3 space-y-3 pb-12">
          {/* 實時全團點餐進度卡片 */}
          <LiveOrderCounter />

          {/* ✨ 現代極簡風格歡迎模塊 */}
          <HomeWelcomeBanner />

          {/* 🔍 店家搜尋列 */}
          <div className="relative">
            <label htmlFor="home-store-search-input" className="sr-only">搜尋店家名稱</label>
            <input
              id="home-store-search-input"
              name="storeSearch"
              type="text"
              aria-label="搜尋店家名稱"
              placeholder="搜尋店家名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* 🏷️ 分類過濾膠囊條 (Pill Tabs) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-touch">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-500/30'
                  : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
              }`}
            >
              全部店家
            </button>
            {categories.map((cat: Category) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-500/30'
                    : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
                }`}
              >
                {stripEmojis(cat.name)}
              </button>
            ))}
          </div>

          {/* 🏪 店家列表 */}
          <div className="space-y-3 pt-1">
            {loading ? (
              <>
                <StoreCardSkeleton />
                <StoreCardSkeleton />
                <StoreCardSkeleton />
              </>
            ) : filteredStores.length === 0 ? (
              <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-xs">
                <StoreIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-80" />
                <p className="text-sm font-medium">找不到符合條件的店家</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">請嘗試其他搜尋關鍵字或分類</p>
              </div>
            ) : (
              filteredStores.map((store: Store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.code || store.id}`}
                  onMouseEnter={() => prefetchStoreData(store.id)}
                  onTouchStart={() => prefetchStoreData(store.id)}
                  className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5 hover:shadow-md hover:border-sky-400 dark:hover:border-sky-500/60 transition-all duration-200 group active:scale-[0.99] relative overflow-hidden shadow-2xs"
                >
                  {/* 店家代碼標籤 (S-001) */}
                  <span className="absolute top-3 right-3 text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800/80 tracking-wide font-mono">
                    #{store.code || 'S-001'}
                  </span>

                  <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-[#182234] flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-800/80">
                    {store.image_url ? (
                      <img
                        src={store.image_url}
                        alt={store.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <StoreIcon className="w-7 h-7 text-sky-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-sky-500 transition-colors">
                      {store.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">點擊瀏覽完整菜單與選購</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-800/60">
                        開放揪團中
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))
            )}
          </div>
        </main>
      </div>

      {/* 底部版本號、主題切換與後台登入按鈕 */}
      <footer className="w-full py-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-2">
          <span 
            title={commitMsg}
            className="cursor-help transition-colors hover:text-slate-600 dark:hover:text-slate-300 select-none font-mono"
          >
            版本: {formatVersionDisplay(commitMsg, commitHash)}
          </span>
          <span>•</span>
          <Link
            href="/admin" 
            className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors hover:underline underline-offset-2"
          >
            後台登入
          </Link>
        </div>

        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

        {/* 🌗 主題切換按鈕 */}
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition active:scale-95 cursor-pointer"
          title={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
          aria-label={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-sky-500" />
          )}
          <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
        </button>
      </footer>
    </div>
  );
}