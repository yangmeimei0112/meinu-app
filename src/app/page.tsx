'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import HomeWelcomeBanner from '@/components/HomeWelcomeBanner';
import { HomeCategoryFilter } from './components/home/HomeCategoryFilter';
import { HomeStoreList } from './components/home/HomeStoreList';
import { HomeFooter } from './components/home/HomeFooter';
import { supabase } from '@/lib/supabase';
import { Store, Category } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import { Search } from 'lucide-react';
import {
  idlePrefetchQueue,
  initGlobalRealtimeCache,
  getAppIndexCache,
  setAppIndexCache,
} from '@/lib/storeMenuCache';

export interface StoreListItem extends Store {
  has_active_group?: boolean;
  active_group_title?: string | null;
}

export default function HomePage() {
  const initialIndex = getAppIndexCache();
  const [categories, setCategories] = useState<Category[]>(initialIndex?.categories || []);
  const [stores, setStores] = useState<StoreListItem[]>(initialIndex?.stores || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(!initialIndex);

  // 搜尋關鍵字輕量防抖，避免高頻輸入時造成卡頓
  const debouncedSearch = useDebounce(searchQuery, 200);

  // 取得環境變數中的 Git 資訊
  const commitMsg = process.env.NEXT_PUBLIC_GIT_COMMIT_MSG || '咩nu 團購點餐平台 v10.5.0';
  const commitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || '';

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
      const [catRes, storeRes, codeRes, groupRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active, enable_countdown, cutoff_time, is_accepting_orders')
          .eq('is_active', true),
        fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        supabase
          .from('group_orders')
          .select('id, store_id, title, status, enable_countdown, cutoff_time')
          .neq('status', 'completed')
          .order('created_at', { ascending: false }),
      ]);

      const catList = (catRes.data as Category[]) || [];
      setCategories(catList);

      if (storeRes.data) {
        const rawStores = storeRes.data as StoreListItem[];
        const codeMap: Record<string, string> = codeRes?.codeMap || {};
        const activeGroups = (groupRes.data || []) as Array<{
          id: string;
          store_id: string;
          title: string;
          status: string;
          enable_countdown?: boolean;
          cutoff_time?: string | null;
        }>;

        const formatted: StoreListItem[] = rawStores.map((s) => {
          const activeGroup = activeGroups.find((g) => g.store_id === s.id && g.status !== 'completed');
          const enableCountdown = s.enable_countdown ?? activeGroup?.enable_countdown;
          const cutoffTime = s.cutoff_time || activeGroup?.cutoff_time;

          return {
            ...s,
            code: codeMap[s.id] || 'S-001',
            enable_countdown: enableCountdown,
            cutoff_time: cutoffTime,
            has_active_group: !!activeGroup,
            active_group_title: activeGroup?.title || null,
          };
        });
        setStores(formatted);

        // 寫入全域 AppIndex 快取供搜尋頁與全站秒開使用
        setAppIndexCache({
          categories: catList,
          stores: formatted,
          codeMap,
          timestamp: Date.now(),
        });

        // 排定 CPU 閒置期背景漸進預抓店家菜單 JSON
        const activeStoreIds = formatted.map((s) => s.id);
        idlePrefetchQueue.enqueue(activeStoreIds);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // 輔助檢查店家是否處於營業接單狀態
  const checkIsStoreAccepting = (store: Store): boolean => {
    if (store.is_accepting_orders === false) return false;
    if (store.enable_countdown && store.cutoff_time) {
      const remaining = new Date(store.cutoff_time).getTime() - Date.now();
      if (remaining <= 0) return false;
    }
    return true;
  };

  // 記憶化店家篩選與智慧沉底排序（營業中置頂，暫停接單自動排到底部）
  const filteredStores = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const matched = stores.filter((store: Store) => {
      const matchesCategory =
        selectedCategory === 'all' || store.category_id === selectedCategory;
      const matchesSearch =
        !query ||
        store.name.toLowerCase().includes(query) ||
        (store.code && store.code.toLowerCase().includes(query)) ||
        (store.code && store.code.replace(/\D/g, '').includes(query));
      return matchesCategory && matchesSearch;
    });

    return matched.sort((a, b) => {
      const aAccepting = checkIsStoreAccepting(a) ? 1 : 0;
      const bAccepting = checkIsStoreAccepting(b) ? 1 : 0;
      if (aAccepting !== bAccepting) {
        return bAccepting - aAccepting; // 營業中在前，暫停接單沉底
      }
      return 0;
    });
  }, [stores, selectedCategory, debouncedSearch]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div>
        <OfflineBanner />
        <Header />

        <main className="flex-1 max-w-md mx-auto w-full px-4 pt-3 space-y-3 pb-12">
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

          {/* 🏷️ 分類過濾膠囊條 */}
          <HomeCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* 🏪 店家列表 */}
          <HomeStoreList
            stores={filteredStores}
            loading={loading}
            checkIsStoreAccepting={checkIsStoreAccepting}
          />
        </main>
      </div>

      {/* 底部版本號、主題切換與後台登入 */}
      <HomeFooter commitMsg={commitMsg} commitHash={commitHash} />
    </div>
  );
}