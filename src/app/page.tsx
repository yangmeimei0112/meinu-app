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
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { theme, toggleTheme } = useTheme();

  // 搜尋關鍵字輕量防抖，避免高頻輸入時造成卡頓
  const debouncedSearch = useDebounce(searchQuery, 200);

  // 取得環境變數中的 Git 資訊（若無則顯示預設字串）
  const commitMsg = process.env.NEXT_PUBLIC_GIT_COMMIT_MSG || '咩nu 團購點餐平台';
  const commitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'v1.0.0';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

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

      if (catRes.data) setCategories(catRes.data as Category[]);
      if (storeRes.data) {
        const rawStores = storeRes.data as Store[];
        const codeMap: Record<string, string> = codeRes?.codeMap || {};
        const formatted = rawStores.map((s) => ({
          ...s,
          code: codeMap[s.id] || 'S-001',
        }));
        setStores(formatted);
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>

          {/* 🏷️ 分類切換標籤列 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#182338]'
              }`}
            >
              全部店家
            </button>
            {categories.map((cat: Category) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#182338]'
                }`}
              >
                {stripEmojis(cat.name)}
              </button>
            ))}
          </div>

          {/* 🏪 店家列表卡片 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>開放點餐店家</span>
              {!loading && (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                  共 {filteredStores.length} 家
                </span>
              )}
            </h3>

            {loading ? (
              // 🦴 骨架屏：模仿實際卡片形狀，消除空白跳動感
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <StoreCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <StoreIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">目前尚無符合的店家</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  可以在後台管理端新增店家與菜單喔！
                </p>
              </div>
            ) : (
              filteredStores.map((store: Store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.code || store.id}`}
                  className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs hover:border-sky-200 dark:hover:border-sky-500/40 hover:shadow-md transition cursor-pointer flex items-center gap-3.5 active:scale-[0.99] block content-auto group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-sky-100 dark:border-sky-900/60">
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
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">點擊瀏覽完整菜單與選購</p>
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
      <footer className="w-full py-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto px-4 pb-24">
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