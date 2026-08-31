'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { Store, Category } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import { SearchHeaderBar } from './components/SearchHeaderBar';
import { SearchCategoryGrid } from './components/SearchCategoryGrid';
import { SearchHistoryList } from './components/SearchHistoryList';
import { SearchFeaturedStores } from './components/SearchFeaturedStores';
import { SearchResultsList } from './components/SearchResultsList';
import {
  getAppIndexCache,
  subscribeAppIndex,
  prefetchAppIndex,
} from '@/lib/storeMenuCache';

export default function SearchPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 🌟 1. 優先自全域 AppIndex 快取同步初始化（0ms 秒開，免等資料庫檢索）
  const initialIndex = getAppIndexCache();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stores, setStores] = useState<Store[]>(initialIndex?.stores || []);
  const [categories, setCategories] = useState<Category[]>(initialIndex?.categories || []);
  const [loading, setLoading] = useState<boolean>(!initialIndex);

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

  const debouncedQuery = useDebounce(searchQuery, 160);

  // 🌟 2. 訂閱全域 AppIndex 變更並在背景執行 SWR 靜默校驗
  useEffect(() => {
    const unsub = subscribeAppIndex((cache) => {
      setStores(cache.stores);
      setCategories(cache.categories);
      setLoading(false);
    });

    const hasCache = !!getAppIndexCache();
    if (!hasCache) {
      setLoading(true);
    }

    prefetchAppIndex()
      .catch((err) => console.error('Prefetch AppIndex error in search:', err))
      .finally(() => setLoading(false));

    return unsub;
  }, []);

  const saveSearchKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const newHistory = [trimmed, ...searchHistory.filter((k) => k !== trimmed)].slice(0, 10);
    setSearchHistory(newHistory);
    try {
      localStorage.setItem('menu_app_search_history', JSON.stringify(newHistory));
    } catch {}
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('menu_app_search_history');
    } catch {}
  };

  const handleSelectKeyword = (keyword: string) => {
    setSearchQuery(keyword);
    saveSearchKeyword(keyword);
  };

  // 建立分類 ID -> 名稱映射字典
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  // 即時搜尋過濾邏輯 (支援店名、代號 S-001 與數字模糊搜尋)
  const searchResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    return stores.filter((s) => {
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.code && s.code.toLowerCase().includes(q);
      const matchCodeNum = s.code && s.code.replace(/\D/g, '').includes(q);
      const matchCategory = s.category_id && categoryMap[s.category_id]?.toLowerCase().includes(q);
      return matchName || matchCode || matchCodeNum || matchCategory;
    });
  }, [debouncedQuery, stores, categoryMap]);

  // 精選/矚目店家 (取前 6 家)
  const featuredStores = useMemo(() => {
    return stores.slice(0, 6);
  }, [stores]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <OfflineBanner />
        <Header />

        <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3 space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          {/* 頂部搜尋列與返回按鈕 */}
          <SearchHeaderBar
            searchQuery={searchQuery}
            inputRef={searchInputRef}
            onSearchChange={(val) => setSearchQuery(val)}
            onSubmit={(e) => {
              e.preventDefault();
              saveSearchKeyword(searchQuery);
            }}
          />

          {/* 根據是否處於搜尋狀態展示不同內容 */}
          {!searchQuery.trim() ? (
            <div className="space-y-5">
              {/* 1. 分類探索網格 */}
              <SearchCategoryGrid
                categories={categories}
                loading={loading}
                onSelectCategory={handleSelectKeyword}
              />

              {/* 2. 歷史搜尋紀錄 */}
              <SearchHistoryList
                searchHistory={searchHistory}
                onSelectKeyword={handleSelectKeyword}
                onRemoveItem={(e, item) => {
                  e.stopPropagation();
                  const updated = searchHistory.filter((k) => k !== item);
                  setSearchHistory(updated);
                  try {
                    localStorage.setItem('menu_app_search_history', JSON.stringify(updated));
                  } catch {}
                }}
                onClearAll={clearSearchHistory}
              />

              {/* 3. 本月矚目店家 */}
              <SearchFeaturedStores
                stores={featuredStores}
                onSelectStore={saveSearchKeyword}
              />
            </div>
          ) : (
            /* 4. 搜尋結果列表 */
            <SearchResultsList
              searchQuery={searchQuery}
              searchResults={searchResults}
              categoryMap={categoryMap}
              loading={loading}
              onClearQuery={() => setSearchQuery('')}
              onSelectStore={saveSearchKeyword}
            />
          )}
        </main>
      </div>
    </div>
  );
}
