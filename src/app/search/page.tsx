'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { Store, Category } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import { stripEmojis } from '@/lib/icon-utils';

import {
  Search,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Store as StoreIcon,
  Coffee,
  Soup,
  CookingPot,
  Sandwich,
  Drumstick,
  Cake,
  Pizza,
  UtensilsCrossed,
} from 'lucide-react';

// 依據後台分類名稱自動對應適配的 Lucide 向量美食圖標
function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('飲') || lower.includes('茶') || lower.includes('咖啡') || lower.includes('水') || lower.includes('手搖')) {
    return <Coffee className="w-6 h-6 text-amber-500" />;
  }
  if (lower.includes('麵') || lower.includes('粉') || lower.includes('湯') || lower.includes('拉麵') || lower.includes('烏龍')) {
    return <Soup className="w-6 h-6 text-sky-500" />;
  }
  if (lower.includes('飯') || lower.includes('便當') || lower.includes('台式') || lower.includes('熱炒') || lower.includes('餐盒')) {
    return <CookingPot className="w-6 h-6 text-emerald-500" />;
  }
  if (lower.includes('早') || lower.includes('吐司') || lower.includes('三明治') || lower.includes('漢堡') || lower.includes('輕食')) {
    return <Sandwich className="w-6 h-6 text-amber-500" />;
  }
  if (lower.includes('炸') || lower.includes('雞') || lower.includes('烤') || lower.includes('排')) {
    return <Drumstick className="w-6 h-6 text-orange-500" />;
  }
  if (lower.includes('甜') || lower.includes('點心') || lower.includes('蛋糕') || lower.includes('冰') || lower.includes('豆花') || lower.includes('烘焙')) {
    return <Cake className="w-6 h-6 text-rose-500" />;
  }
  if (lower.includes('披薩') || lower.includes('義') || lower.includes('美') || lower.includes('洋食') || lower.includes('義大利')) {
    return <Pizza className="w-6 h-6 text-red-500" />;
  }
  return <UtensilsCrossed className="w-6 h-6 text-sky-500" />;
}

export default function SearchPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 🕒 搜尋歷史紀錄 (儲存於 localStorage)
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('menu_app_search_history');
        return raw ? JSON.parse(raw) : ['飲料', '便當', 'S-001'];
      } catch {}
    }
    return ['飲料', '便當', 'S-001'];
  });

  // 防抖處理
  const debouncedQuery = useDebounce(searchQuery, 160);

  // 載入店家與分類
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [catRes, storeRes, codeRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('stores').select('*').eq('is_active', true),
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

  // 自動聚焦輸入框
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // 類別 ID 對應名稱字典
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // 儲存新的搜尋紀錄
  const saveSearchKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('menu_app_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 移除單筆搜尋紀錄
  const removeSearchHistoryItem = (e: React.MouseEvent, target: string) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item !== target);
      try {
        localStorage.setItem('menu_app_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // 清空所有搜尋紀錄
  const clearAllSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('menu_app_search_history');
    } catch {}
  };

  // 點擊歷史紀錄或人氣分類執行搜尋
  const handleSelectKeyword = (keyword: string) => {
    setSearchQuery(keyword);
    saveSearchKeyword(keyword);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // 表單送出事件
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchKeyword(searchQuery.trim());
    }
  };

  // 搜尋過濾結果
  const searchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return stores.filter((store) => {
      const nameMatch = store.name.toLowerCase().includes(q);
      const codeMatch =
        (store.code && store.code.toLowerCase().includes(q)) ||
        (store.code && store.code.replace(/\D/g, '').includes(q));
      const categoryName = store.category_id ? categoryMap[store.category_id] : '';
      const categoryMatch = categoryName ? categoryName.toLowerCase().includes(q) : false;
      return nameMatch || codeMatch || categoryMatch;
    });
  }, [stores, debouncedQuery, categoryMap]);

  // 本月矚目店家精選推薦 (前 3-4 家)
  const featuredStores = useMemo(() => {
    return stores.slice(0, 4);
  }, [stores]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <OfflineBanner />
        <Header />

        <main className="max-w-md mx-auto w-full px-4 pt-3 space-y-5 pb-28">
          {/* 頂部返回導覽 */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>返回「咩nu」大廳</span>
            </Link>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              全站智慧搜尋
            </span>
          </div>

          {/* 🔍 頂部膠囊型常駐搜尋列 (參考附圖) */}
          <form onSubmit={handleSearchSubmit} className="relative group">
            <label htmlFor="search-page-input" className="sr-only">
              搜尋餐廳和生鮮雜貨店家
            </label>
            <input
              ref={searchInputRef}
              id="search-page-input"
              type="text"
              aria-label="搜尋餐廳、餐點或店家代號"
              placeholder="搜尋餐廳、餐點或店家代號 (S-001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-500 transition-all shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {/* 放大鏡圖示 */}
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-sky-500" />
            {/* 一鍵清空按鈕 */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                aria-label="清除搜尋內容"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </form>

          {/* 條件一：未輸入搜尋關鍵字時，展示【人氣分類】、【搜尋紀錄】與【本月矚目店家】(附圖樣式) */}
          {!isSearching ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1. 🔥 店家分類 (同步後台設定之分類) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>店家分類</span>
                  </h3>
                  {categories.length > 0 && (
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      共 {categories.length} 種分類
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-4 gap-2.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-[#131B2B] border border-slate-100 dark:border-slate-800 animate-pulse"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
                        <div className="w-10 h-3 rounded bg-slate-100 dark:bg-slate-800/80" />
                      </div>
                    ))}
                  </div>
                ) : categories.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectKeyword(stripEmojis(cat.name))}
                        className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-[#131B2B] border border-slate-100 dark:border-slate-800/80 shadow-2xs hover:border-sky-300 dark:hover:border-sky-500/50 hover:shadow-xs transition active:scale-95 cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getCategoryIcon(cat.name)}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-500 transition-colors truncate max-w-full px-1">
                          {stripEmojis(cat.name)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                    目前後台尚未建立店家分類
                  </p>
                )}
              </div>

              {/* 2. 🕒 搜尋紀錄 (參考附圖中間時鐘條目排版) */}
              {searchHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                      搜尋紀錄
                    </h3>
                    <button
                      type="button"
                      onClick={clearAllSearchHistory}
                      className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                    >
                      全部清空
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#131B2B] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xs">
                    {searchHistory.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSelectKeyword(item)}
                        className="flex items-center justify-between px-3.5 py-3 hover:bg-slate-50 dark:hover:bg-[#182338] transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-500 transition-colors truncate">
                            {item}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => removeSearchHistoryItem(e, item)}
                          aria-label={`刪除搜尋紀錄 ${item}`}
                          className="text-slate-300 dark:text-slate-600 hover:text-rose-500 p-1 text-sm transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 🌟 本月矚目店家 (參考附圖底部品牌卡片排版) */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>本月矚目店家</span>
                </h3>

                <div className="grid grid-cols-3 gap-2.5">
                  {featuredStores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.code || store.id}`}
                      onClick={() => saveSearchKeyword(store.name)}
                      className="bg-white dark:bg-[#131B2B] rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-2xs hover:border-sky-200 dark:hover:border-sky-500/40 hover:shadow-xs transition flex flex-col items-center text-center gap-2 group active:scale-95"
                    >
                      <div className="w-14 h-14 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 overflow-hidden flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                        {store.image_url ? (
                          <img
                            src={store.image_url}
                            alt={store.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <StoreIcon className="w-6 h-6 text-sky-500" />
                        )}
                      </div>
                      <div className="w-full">
                        <p className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                          {store.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                          {store.code || 'S-001'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 條件二：有輸入關鍵字時，展示即時搜尋結果清單 */
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  搜尋「<span className="text-sky-500 dark:text-sky-400 font-extrabold">{searchQuery}</span>」的結果：
                </p>
                <span className="text-xs text-slate-400 font-bold">
                  共 {searchResults.length} 家
                </span>
              </div>

              {loading ? (
                <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-8 text-center text-slate-400 text-xs animate-pulse border border-slate-100 dark:border-slate-800">
                  正在即時檢索店家資料庫...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                      查無符合「{searchQuery}」的店家
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      請嘗試輸入其他關鍵字、或直接輸入店家代碼 (如 S-001)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="inline-block bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-bold text-xs px-4 py-2 rounded-xl border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                  >
                    清除搜尋條件
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {searchResults.map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.code || store.id}`}
                      onClick={() => saveSearchKeyword(store.name)}
                      className="bg-white dark:bg-[#131B2B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-2xs hover:border-sky-200 dark:hover:border-sky-500/40 hover:shadow-xs transition active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                          {store.image_url ? (
                            <img
                              src={store.image_url}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <StoreIcon className="w-5 h-5 text-sky-500" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-sky-500 transition-colors">
                            {store.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {store.category_id && categoryMap[store.category_id] && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">
                                {categoryMap[store.category_id]}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              代號：{store.code || 'S-001'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-0.5 text-sky-500 text-xs font-black shrink-0 group-hover:translate-x-0.5 transition-transform">
                        <span>進入點餐</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
