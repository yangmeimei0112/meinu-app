'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Store, MenuItem } from '@/types/database';
import type { GroupOrderMeta } from '../components/StoreNoticeBanner';
import { getStoreCache, setStoreCache, subscribeStoreCache } from '@/lib/storeMenuCache';

interface UseStoreDataProps {
  storeId: string;
  initialStoreCode?: string;
}

export function useStoreData({ storeId, initialStoreCode }: UseStoreDataProps) {
  // 🌟 1. 優先從記憶體 SWR 快取同步初始化（若命中則 0ms 瞬間渲染，免等骨架屏）
  const initialCached = getStoreCache(storeId) || (initialStoreCode ? getStoreCache(initialStoreCode) : null);

  const [store, setStore] = useState<Store | null>(initialCached?.store || null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialCached?.menuItems || []);
  const [groupMeta, setGroupMeta] = useState<GroupOrderMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialCached);

  const [groupTotalAmount, setGroupTotalAmount] = useState<number>(0);
  const [popularCounts, setPopularCounts] = useState<Record<string, number>>({});
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const isMountedRef = useRef(true);
  const activeGroupIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🌟 2. 訂閱全域快取事件（當背景 SWR 或 Realtime 補丁更新時即時反應至 UI）
  useEffect(() => {
    const unsub = subscribeStoreCache(storeId, (entry) => {
      if (isMountedRef.current) {
        setStore(entry.store);
        setMenuItems(entry.menuItems);
        setLoading(false);
      }
    });
    return unsub;
  }, [storeId]);

  // 🌟 3. 背景 SWR 靜默拉取與校驗
  const fetchData = useCallback(async (isSilent: boolean = false) => {
    if (!isMountedRef.current) return;
    if (!isSilent) {
      setLoading(true);
    }

    try {
      // 並行發送查詢，消除網路瀑布流延遲
      const [storeRes, menuRes, groupRes, sortRes, codeRes] = await Promise.all([
        supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single(),
        supabase
          .from('menu_items')
          .select('id, store_id, name, price, description, is_sold_out, custom_groups')
          .eq('store_id', storeId),
        supabase
          .from('group_orders')
          .select('*')
          .eq('store_id', storeId)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1),
        fetch(`/api/menu/sort-order?storeId=${storeId}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null),
        fetch(`/api/stores/code?storeId=${storeId}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (!isMountedRef.current) return;

      let resolvedStore: Store | null = null;
      if (storeRes.data) {
        const storeData = storeRes.data as Store;
        const activeCode = codeRes?.code || initialStoreCode || storeData.code;
        if (activeCode) {
          storeData.code = activeCode;
          if (typeof window !== 'undefined' && !window.location.pathname.includes(activeCode)) {
            window.history.replaceState(null, '', `/stores/${activeCode}`);
          }
        }
        resolvedStore = storeData;
        setStore(storeData);
      }

      let resolvedItems: MenuItem[] = [];
      if (menuRes.data) {
        const items = menuRes.data as MenuItem[];

        // 讀取自訂排序：優先從 API，其次從 localStorage 快取雙重容災備援
        let customOrder: string[] | null = null;
        if (sortRes && Array.isArray(sortRes.orderedItemIds) && sortRes.orderedItemIds.length > 0) {
          customOrder = sortRes.orderedItemIds;
        } else if (typeof window !== 'undefined') {
          try {
            const localRaw = localStorage.getItem('menu_app_store_sort_orders');
            if (localRaw) {
              const parsed = JSON.parse(localRaw);
              if (Array.isArray(parsed[storeId]) && parsed[storeId].length > 0) {
                customOrder = parsed[storeId];
              }
            }
          } catch {}
        }

        if (customOrder && customOrder.length > 0) {
          const orderMap = new Map<string, number>();
          customOrder.forEach((id: string, idx: number) => orderMap.set(id, idx));

          items.sort((a, b) => {
            const posA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
            const posB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
            if (posA !== posB) return posA - posB;
            return a.name.localeCompare(b.name, 'zh-TW');
          });
        }

        resolvedItems = items;
        if (isMountedRef.current) setMenuItems(items);
      }

      // 同步寫入全域快取
      if (resolvedStore) {
        setStoreCache(storeId, {
          store: resolvedStore,
          menuItems: resolvedItems,
          customOrder: sortRes?.orderedItemIds || null,
          timestamp: Date.now(),
        });
      }

      if (groupRes.data && groupRes.data.length > 0) {
        const grp = groupRes.data[0];
        activeGroupIdRef.current = grp.id;

        if (isMountedRef.current) {
          setGroupMeta({
            id: grp.id,
            announcement: grp.announcement,
            status: grp.status,
            enable_min_threshold: grp.enable_min_threshold,
            min_threshold_amount: grp.min_threshold_amount,
            enable_countdown: grp.enable_countdown,
            cutoff_time: grp.cutoff_time,
            enable_budget_limit: grp.enable_budget_limit,
            budget_limit_amount: grp.budget_limit_amount,
          });
        }

        // 統計熱門排行與團購金額
        const { data: subData } = await supabase
          .from('order_submissions')
          .select('id, total_amount')
          .eq('group_order_id', grp.id);

        if (!isMountedRef.current) return;

        if (subData) {
          const total = subData.reduce((acc, cur) => acc + (cur.total_amount || 0), 0);
          setGroupTotalAmount(total);

          const subIds = subData.map((s) => s.id);
          if (subIds.length > 0) {
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('item_name, quantity')
              .in('submission_id', subIds);

            if (!isMountedRef.current) return;

            if (itemsData) {
              const counts: Record<string, number> = {};
              itemsData.forEach((item) => {
                if (item.item_name) {
                  counts[item.item_name] = (counts[item.item_name] || 0) + (item.quantity || 1);
                }
              });
              setPopularCounts(counts);
            }
          }
        }
      } else {
        activeGroupIdRef.current = null;
      }
    } catch (e) {
      console.error('Fetch store data error:', e);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [storeId, initialStoreCode]);

  // 節流版 fetchData
  const debouncedFetchData = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchData(true);
    }, 250);
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;

    // 若已有快取，以靜默方式在背景重新比對校驗 (SWR)；否則正常載入
    const hasCache = !!getStoreCache(storeId);
    fetchData(hasCache);

    const channel = supabase
      .channel(`store_group_${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_orders', filter: `store_id=eq.${storeId}` },
        debouncedFetchData
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_submissions' },
        debouncedFetchData
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_submissions' },
        debouncedFetchData
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [storeId, fetchData, debouncedFetchData]);

  // 倒數計時計算邏輯 (優先讀取 store 即時營運設定，次讀 groupMeta 相容)
  useEffect(() => {
    const isCountdownEnabled = store?.enable_countdown ?? groupMeta?.enable_countdown;
    const cutoffTime = store?.cutoff_time || groupMeta?.cutoff_time;

    if (!isCountdownEnabled || !cutoffTime) {
      setCountdownSeconds(0);
      return;
    }

    const targetDate = new Date(cutoffTime).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetDate - now) / 1000));
      setCountdownSeconds(diff);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [store, groupMeta]);

  return {
    store,
    menuItems,
    groupMeta,
    loading,
    groupTotalAmount,
    popularCounts,
    countdownSeconds,
  };
}
