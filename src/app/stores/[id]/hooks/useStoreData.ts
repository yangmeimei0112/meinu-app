'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Store, MenuItem } from '@/types/database';
import type { GroupOrderMeta } from '../components/StoreNoticeBanner';

interface UseStoreDataProps {
  storeId: string;
  initialStoreCode?: string;
}

export function useStoreData({ storeId, initialStoreCode }: UseStoreDataProps) {
  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [groupMeta, setGroupMeta] = useState<GroupOrderMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [groupTotalAmount, setGroupTotalAmount] = useState<number>(0);
  const [popularCounts, setPopularCounts] = useState<Record<string, number>>({});
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 並行發送查詢，消除網路瀑布流延遲
      const [storeRes, menuRes, groupRes, sortRes, codeRes] = await Promise.all([
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active')
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

      if (storeRes.data) {
        const storeData = storeRes.data as Store;
        const activeCode = codeRes?.code || initialStoreCode || storeData.code;
        if (activeCode) {
          storeData.code = activeCode;
          if (typeof window !== 'undefined' && !window.location.pathname.includes(activeCode)) {
            window.history.replaceState(null, '', `/stores/${activeCode}`);
          }
        }
        setStore(storeData);
      }

      if (menuRes.data) {
        let items = menuRes.data as MenuItem[];

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

        setMenuItems(items);
      }

      if (groupRes.data && groupRes.data.length > 0) {
        const grp = groupRes.data[0];
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

        // 統計熱門排行與團購金額
        const { data: subData } = await supabase
          .from('order_submissions')
          .select('id, total_amount')
          .eq('group_order_id', grp.id);

        if (subData) {
          const total = subData.reduce((acc, cur) => acc + (cur.total_amount || 0), 0);
          setGroupTotalAmount(total);

          const subIds = subData.map((s) => s.id);
          if (subIds.length > 0) {
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('menu_item_id, quantity')
              .in('submission_id', subIds);

            if (itemsData) {
              const counts: Record<string, number> = {};
              itemsData.forEach((item) => {
                if (item.menu_item_id) {
                  counts[item.menu_item_id] = (counts[item.menu_item_id] || 0) + item.quantity;
                }
              });
              setPopularCounts(counts);
            }
          }
        }
      }

      setLoading(false);
    }

    fetchData();

    // 實時監聽團購單與點餐更新
    const channel = supabase
      .channel(`store_group_${storeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_orders', filter: `store_id=eq.${storeId}` },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_submissions' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, initialStoreCode]);

  // 倒數計時計算邏輯
  useEffect(() => {
    if (!groupMeta?.enable_countdown || !groupMeta?.cutoff_time) {
      setCountdownSeconds(0);
      return;
    }

    const targetDate = new Date(groupMeta.cutoff_time).getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((targetDate - now) / 1000));
      setCountdownSeconds(diff);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [groupMeta]);

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
