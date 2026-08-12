'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Store, Category } from '@/types/database';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true);

      if (catData) setCategories(catData as Category[]);
      if (storeData) setStores(storeData as Store[]);
      
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredStores = stores.filter((store: Store) => {
    const matchesCategory =
      selectedCategory === 'all' || store.category_id === selectedCategory;
    const matchesSearch = store.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 space-y-4 pb-12">
        {/* 淡藍主題歡迎橫幅 */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white rounded-3xl p-5 shadow-sm">
          <p className="text-xs font-medium opacity-90">👋 歡迎來到</p>
          <h2 className="text-xl font-extrabold mt-0.5">「咩nu」開放點餐大廳</h2>
          <p className="text-xs opacity-90 mt-1">
            自由挑選喜歡的店家菜單，隨手揪團輕鬆點餐！
          </p>
        </div>

        {/* 🔍 店家搜尋列 */}
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋店家名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 border border-slate-200 rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition shadow-xs"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
        </div>

        {/* 🏷️ 分類切換標籤列 */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            全部店家
          </button>
          {categories.map((cat: Category) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 🏪 店家列表卡片 */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center justify-between">
            <span>開放點餐店家</span>
            <span className="text-xs text-slate-400 font-normal">
              共 {filteredStores.length} 家
            </span>
          </h3>

          {loading ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-sm animate-pulse">
              正在載入「咩nu」店家清單...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 space-y-2">
              <div className="text-3xl">☕</div>
              <p className="text-sm font-semibold text-slate-600">目前尚無符合的店家</p>
              <p className="text-xs text-slate-400">
                可以在後台管理端新增店家與菜單喔！
              </p>
            </div>
          ) : (
            filteredStores.map((store: Store) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:border-sky-200 hover:shadow-md transition cursor-pointer flex items-center gap-3.5 active:scale-[0.99] block"
              >
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-sky-100">
                  {store.image_url ? (
                    <img
                      src={store.image_url}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🥤'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-base truncate">
                    {store.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">點擊瀏覽完整菜單與選購</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block bg-sky-50 text-sky-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100">
                      開放揪團中
                    </span>
                  </div>
                </div>
                <span className="text-slate-300 text-lg">›</span>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* 底部版本號與後台登入按鈕 */}
      <footer className="w-full py-6 flex items-center justify-center gap-2 text-xs text-gray-400 border-t border-slate-200">
        <span>v1.0.0</span>
        <span>•</span>
        <Link
          href="/admin" 
          className="hover:text-gray-600 transition-colors hover:underline underline-offset-2"
        >
          後台登入
        </Link>
      </footer>
    </div>
  );
}