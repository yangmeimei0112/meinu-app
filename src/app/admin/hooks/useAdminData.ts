'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Category, MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
import { GroupOrderAdmin, OrderSubmissionAdmin } from '../admin-types';
import { SpeechOrderItem, SpeechOrderPayload } from './useAdminSpeech';
import { fetchAdminAllData } from './data/adminDataFetchers';

interface RawOrderItemRow {
  item_name: string;
  quantity: number;
  custom_notes: string | null;
  unit_price: number;
}

interface UseAdminDataProps {
  isUnlocked: boolean;
  playNewOrderSound: () => void;
  speakNewOrder: (order: SpeechOrderPayload, immediate?: boolean) => void;
  showToast: (msg: string) => void;
}

export function useAdminData({
  isUnlocked,
  playNewOrderSound,
  speakNewOrder,
  showToast,
}: UseAdminDataProps) {
  const [activeGroup, setActiveGroup] = useState<GroupOrderAdmin | null>(null);
  const [activeGroups, setActiveGroups] = useState<GroupOrderAdmin[]>([]);
  const [selectedActiveGroupId, setSelectedActiveGroupId] = useState<string>('all');
  const selectedActiveGroupIdRef = useRef<string>('all');

  useEffect(() => {
    selectedActiveGroupIdRef.current = selectedActiveGroupId;
  }, [selectedActiveGroupId]);

  const [archivedGroups, setArchivedGroups] = useState<GroupOrderAdmin[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [soldOutOptions, setSoldOutOptions] = useState<SoldOutOption[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<OrderSubmissionAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [inputDeliveryFee, setInputDeliveryFee] = useState<number>(0);
  const [inputDiscount, setInputDiscount] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<'floor' | 'ceil' | 'round'>('floor');

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const processedNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const sessionMountTimeRef = useRef<number>(0);

  useEffect(() => {
    if (sessionMountTimeRef.current === 0) {
      sessionMountTimeRef.current = Date.now();
    }
  }, []);

  // 🔔 叮咚新訂單響鈴與 🗣️ 語音報單智慧分流
  const notifyNewOrder = useCallback(
    async (orderId: string, nickname: string, orderCreatedAt?: string | number, initialAmount?: number) => {
      if (processedNotificationIdsRef.current.has(orderId)) return;

      if (orderCreatedAt) {
        const orderTime = typeof orderCreatedAt === 'number' ? orderCreatedAt : new Date(orderCreatedAt).getTime();
        const baseMountTime = sessionMountTimeRef.current || Date.now();
        if (!isNaN(orderTime) && orderTime < baseMountTime - 3000) {
          processedNotificationIdsRef.current.add(orderId);
          return;
        }
      }

      processedNotificationIdsRef.current.add(orderId);
      knownOrderIdsRef.current.add(orderId);

      try {
        const arr = Array.from(processedNotificationIdsRef.current).slice(-300);
        sessionStorage.setItem('menu_app_processed_notifications', JSON.stringify(arr));
      } catch {}

      // 1. 播放接單叮咚鈴聲
      playNewOrderSound();
      showToast(`收到 ${nickname || '團員'} 的新訂單！`);

      // 2. 語音報單
      (async () => {
        try {
          let itemRows: RawOrderItemRow[] = [];
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data } = await supabase
              .from('order_items')
              .select('item_name, quantity, custom_notes, unit_price')
              .eq('submission_id', orderId);
            if (data && data.length > 0) {
              itemRows = data as RawOrderItemRow[];
              break;
            }
            await new Promise((res) => setTimeout(res, 180));
          }

          let items: SpeechOrderItem[] = [];
          let totalAmount = initialAmount || 0;

          if (itemRows && itemRows.length > 0) {
            items = itemRows.map((r: RawOrderItemRow) => ({
              name: r.item_name,
              quantity: r.quantity,
              notes: r.custom_notes,
            }));
            if (!totalAmount) {
              totalAmount = itemRows.reduce((sum: number, r: RawOrderItemRow) => sum + (r.unit_price * r.quantity), 0);
            }
          }

          speakNewOrder(
            {
              orderId,
              nickname,
              total_amount: totalAmount,
              items,
            },
            false
          );
        } catch (err) {
          console.warn('語音報單抓取明細失敗，執行摘要播報:', err);
          speakNewOrder(
            {
              orderId,
              nickname,
              total_amount: initialAmount || 0,
              items: [],
            },
            false
          );
        }
      })();
    },
    [playNewOrderSound, speakNewOrder, showToast]
  );

  // ⚡ 根據選中的店家/活動在記憶體中即時過濾訂單
  const submissions = useMemo(() => {
    if (!selectedActiveGroupId || selectedActiveGroupId === 'all') {
      return allSubmissions;
    }
    return allSubmissions.filter(
      (s) => s.store_id === selectedActiveGroupId || s.group_order_id === selectedActiveGroupId
    );
  }, [allSubmissions, selectedActiveGroupId]);

  // 📊 統計摘要
  const itemSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    submissions.forEach((sub) => {
      (sub.order_items || []).forEach((item) => {
        const key = item.custom_notes
          ? `${item.item_name} (${item.custom_notes})`
          : item.item_name;
        summary[key] = (summary[key] || 0) + item.quantity;
      });
    });
    return summary;
  }, [submissions]);

  const grandTotal = useMemo(() => {
    return submissions.reduce((sum, s) => sum + (s.final_amount || 0), 0);
  }, [submissions]);

  const paidTotal = useMemo(() => {
    return submissions.filter((s) => s.is_paid).reduce((sum, s) => sum + (s.final_amount || 0), 0);
  }, [submissions]);

  // 抓取全域後台資料
  const fetchAdminData = useCallback(async (targetGroupId?: string, isSilent: boolean = true) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const data = await fetchAdminAllData();

      setStores(data.stores);
      setCategories(data.categories);
      setPaymentMethods(data.paymentMethods);
      setSoldOutOptions(data.soldOutOptions);
      setAllMenuItems(data.allMenuItems);
      setArchivedGroups(data.archivedGroups);
      setActiveGroups(data.activeGroups);
      setAllSubmissions(data.formattedSubs);

      data.formattedSubs.forEach((s) => {
        knownOrderIdsRef.current.add(s.id);
        processedNotificationIdsRef.current.add(s.id);
      });

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }

      const effectiveGroupId = targetGroupId !== undefined ? targetGroupId : selectedActiveGroupIdRef.current;
      let currentGroup: GroupOrderAdmin | null = null;
      if (effectiveGroupId && effectiveGroupId !== 'all') {
        currentGroup = data.activeGroups.find((g) => g.id === effectiveGroupId) || null;
      }

      setActiveGroup(currentGroup);
      if (currentGroup) {
        setInputDeliveryFee(currentGroup.delivery_fee || 0);
        setInputDiscount(currentGroup.discount_amount || 0);
        setRoundingRule((currentGroup.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
      }
    } catch (err) {
      console.error('抓取資料失敗:', err);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) fetchAdminData(undefined, false);
  }, [isUnlocked, fetchAdminData]);

  // Realtime 與 3 秒智慧雙保險輪詢
  useEffect(() => {
    if (!isUnlocked) return;

    const channelName = `admin-rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_submissions' },
        (payload) => {
          const newSub = payload.new as { id?: string; user_nickname?: string; created_at?: string; total_amount?: number };
          if (newSub?.id) {
            notifyNewOrder(newSub.id, newSub.user_nickname || '團員', newSub.created_at, newSub.total_amount);
          }
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_submissions' },
        (payload) => {
          const updatedSub = payload.new as any;
          if (updatedSub?.id) {
            setAllSubmissions((prev) =>
              prev.map((s) =>
                s.id === updatedSub.id
                  ? {
                      ...s,
                      ...updatedSub,
                      order_items: s.order_items,
                      store_name: s.store_name,
                    }
                  : s
              )
            );
            fetchAdminData(selectedActiveGroupIdRef.current, true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'order_submissions' },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setAllSubmissions((prev) => prev.filter((s) => s.id !== deletedId));
            knownOrderIdsRef.current.delete(deletedId);
          }
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_orders' },
        () => {
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .subscribe();

    const pollingTimer = setInterval(async () => {
      try {
        const { data: latestSubs } = await supabase
          .from('order_submissions')
          .select('id, user_nickname, created_at, group_order_id, total_amount')
          .order('created_at', { ascending: false });

        if (latestSubs && !isInitialLoadRef.current) {
          const currentIdSet = new Set(latestSubs.map((s) => s.id));
          let hasNew = false;
          let hasDeleted = false;

          for (const sub of latestSubs) {
            const orderTime = sub.created_at ? new Date(sub.created_at).getTime() : 0;
            if (orderTime < sessionMountTimeRef.current - 3000) {
              processedNotificationIdsRef.current.add(sub.id);
              continue;
            }

            if (!processedNotificationIdsRef.current.has(sub.id)) {
              hasNew = true;
              notifyNewOrder(sub.id, sub.user_nickname, orderTime, sub.total_amount);
            }
          }

          for (const knownId of Array.from(knownOrderIdsRef.current)) {
            if (!currentIdSet.has(knownId)) {
              hasDeleted = true;
              knownOrderIdsRef.current.delete(knownId);
            }
          }

          if (hasNew || hasDeleted) {
            fetchAdminData(selectedActiveGroupIdRef.current, true);
          }
        }
      } catch (err) {
        console.error('智慧輪詢更新失敗:', err);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingTimer);
    };
  }, [isUnlocked, fetchAdminData, notifyNewOrder]);

  // 🌟 樂觀更新特定店家菜單品項順序
  const optimisticReorderMenuItems = useCallback((storeId: string, orderedItemIds: string[]) => {
    setAllMenuItems((prev) => {
      const storeItems = prev.filter((item) => item.store_id === storeId);
      const otherItems = prev.filter((item) => item.store_id !== storeId);

      const sortedStoreItems = [...storeItems].sort((a, b) => {
        const indexA = orderedItemIds.indexOf(a.id);
        const indexB = orderedItemIds.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name, 'zh-TW');
      });

      return [...otherItems, ...sortedStoreItems];
    });
  }, []);

  return {
    activeGroup,
    setActiveGroup,
    activeGroups,
    setActiveGroups,
    selectedActiveGroupId,
    setSelectedActiveGroupId,
    selectedActiveGroupIdRef,
    archivedGroups,
    setArchivedGroups,
    stores,
    setStores,
    categories,
    setCategories,
    paymentMethods,
    setPaymentMethods,
    soldOutOptions,
    setSoldOutOptions,
    allMenuItems,
    setAllMenuItems,
    optimisticReorderMenuItems,
    allSubmissions,
    setAllSubmissions,
    submissions,
    itemSummary,
    grandTotal,
    paidTotal,
    loading,
    fetchAdminData,
    inputDeliveryFee,
    setInputDeliveryFee,
    inputDiscount,
    setInputDiscount,
    roundingRule,
    setRoundingRule,
  };
}
