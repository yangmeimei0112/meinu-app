'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { Store, Category } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import { SearchHeaderBar } from './components/SearchHeaderBar';
import { SearchCategoryGrid } from './components/SearchCategoryGrid';
import { SearchHistoryList } from './components/SearchHistoryList';
import { SearchFeaturedStores } from './components/SearchFeaturedStores';
import { SearchResultsList } from './components/SearchResultsList';

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

  const debouncedQuery = useDebounce(searchQuery, 160);

  // 載入店家與分類資料
  useEffect(() => {
    async function fetchSearchMeta() {
      setLoading(true);
      try {
        const [catRes, storeRes, codeRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, sort_order')
            .order('sort_order', { ascending: true }),
          supabase
            .from('stores')
            .select('id, name, image_url, category_id, is_active')
            .eq('is_active', true),
          fetch('/api/stores/code', { cache: 'no-store' })
            .then((r) => r.json())
            .catch(() => null),
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
      } catch (err) {
        console.error('載入搜尋資料庫失敗', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSearchMeta();
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

  const removeSearchHistoryItem = (e: React.MouseEvent, target: string) => {
    e.stopPropagation();
    const updated = searchHistory.filter((k) => k !== target);
    setSearchHistory(updated);
    try {
      localStorage.setItem('menu_app_search_history', JSON.stringify(updated));
    } catch {}
  };

  const clearAllSearchHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem('menu_app_search_history');
    } catch {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchKeyword(searchQuery.trim());
    }
  };

  const handleSelectKeyword = (keyword: string) => {
    setSearchQuery(keyword);
    saveSearchKeyword(keyword);
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const searchResults = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return [];

    return stores.filter((store) => {
      const matchName = store.name.toLowerCase().includes(query);
      const matchCode = (store.code || '').toLowerCase().includes(query);
      const catName = store.category_id && categoryMap[store.category_id] ? categoryMap[store.category_id] : '';
      const matchCat = catName.toLowerCase().includes(query);
      return matchName || matchCode || matchCat;
    });
  }, [stores, debouncedQuery, categoryMap]);

  const featuredStores = useMemo(() => stores.slice(0, 6), [stores]);
  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="sticky top-0 z-40">
        <OfflineBanner />
        <Header />
      </div>

      <main className="max-w-md mx-auto w-full px-4 pt-3 space-y-5 pb-28">
        {/* 頂部膠囊型常駐搜尋列 */}
        <SearchHeaderBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          inputRef={searchInputRef}
        />

        {!isSearching ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 1. 店家分類 */}
            <SearchCategoryGrid
              categories={categories}
              loading={loading}
              onSelectCategory={handleSelectKeyword}
            />

            {/* 2. 搜尋歷史紀錄 */}
            <SearchHistoryList
              searchHistory={searchHistory}
              onSelectKeyword={handleSelectKeyword}
              onRemoveItem={removeSearchHistoryItem}
              onClearAll={clearAllSearchHistory}
            />

            {/* 3. 本月矚目店家 */}
            <SearchFeaturedStores
              stores={featuredStores}
              onSelectStore={saveSearchKeyword}
            />
          </div>
        ) : (
          /* 即時搜尋結果清單 */
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
  );
}
