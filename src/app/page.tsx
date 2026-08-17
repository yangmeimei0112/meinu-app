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
      const [catRes, storeRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active')
          .eq('is_active', true),
      ]);

      if (catRes.data) setCategories(catRes.data as Category[]);
      if (storeRes.data) setStores(storeRes.data as Store[]);

      setLoading(false);
    }

    fetchData();
  }, []);

  // 記憶化店家篩選結果
  const filteredStores = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return stores.filter((store: Store) => {
      const matchesCategory =
        selectedCategory === 'all' || store.category_id === selectedCategory;
      const matchesSearch = !query || store.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [stores, selectedCategory, debouncedSearch]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <OfflineBanner />
        <Header />

        <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3 space-y-3 pb-12">
          {/* 實時全團點餐進度卡片 */}
          <LiveOrderCounter />

          {/* 淡藍主題歡迎橫幅 */}
          <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 dark:from-sky-600 dark:via-blue-700 dark:to-indigo-800 text-white rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-medium opacity-90">👋 歡迎來到</p>
            <h2 className="text-xl font-extrabold mt-0.5">「咩nu」開放點餐大廳</h2>
            <p className="text-xs opacity-90 mt-1">
              自由挑選喜歡的店家菜單，隨手揪團輕鬆點餐！
            </p>
          </div>

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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">
              🔍
            </span>
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
                {cat.name}
              </button>
            ))}
          </div>

          {/* 🏪 店家列表卡片 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
              <span>開放點餐店家</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                共 {filteredStores.length} 家
              </span>
            </h3>

            {loading ? (
              <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse border border-slate-100 dark:border-slate-800">
                正在載入「咩nu」店家清單...
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-3xl">☕</div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">目前尚無符合的店家</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  可以在後台管理端新增店家與菜單喔！
                </p>
              </div>
            ) : (
              filteredStores.map((store: Store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.id}`}
                  className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs hover:border-sky-200 dark:hover:border-sky-500/40 hover:shadow-md transition cursor-pointer flex items-center gap-3.5 active:scale-[0.99] block content-auto"
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
                      '🥤'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate">
                      {store.name}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">點擊瀏覽完整菜單與選購</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-800/60">
                        開放揪團中
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600 text-lg">›</span>
                </Link>
              ))
            )}
          </div>
        </main>
      </div>

      {/* 底部版本號、主題切換與後台登入按鈕 */}
      <footer className="w-full py-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto px-4">
        <div className="flex items-center gap-2">
          <span 
            title={commitMsg}
            className="cursor-help transition-colors hover:text-slate-600 dark:hover:text-slate-300 select-none"
          >
            版本: {commitHash}
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

        {/* 🌗 主題切換按鈕（精緻低調設計，不突兀） */}
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition active:scale-95 cursor-pointer"
          title={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
          aria-label={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
        >
          <span className="text-[13px]">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
        </button>
      </footer>
    </div>
  );
}