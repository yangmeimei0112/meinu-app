'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Category, MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
import { GroupOrderAdmin, OrderSubmissionAdmin } from '../admin-types';
import { SpeechOrderItem, SpeechOrderPayload } from './useAdminSpeech';

interface UseAdminDataProps {
  isUnlocked: boolean;
  playChimeSound: () => void;
  isSoundEnabled: boolean;
  speakOrder: (order: SpeechOrderPayload, immediate?: boolean) => void;
  isSpeechEnabled: boolean;
  showToast: (msg: string) => void;
}

export function useAdminData({
  isUnlocked,
  playChimeSound,
  isSoundEnabled,
  speakOrder,
  isSpeechEnabled,
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
  const sessionMountTimeRef = useRef<number>(Date.now());

  // 🔔 叮咚新訂單響鈴與 🗣️ 語音報單智慧分流
  const notifyNewOrder = useCallback(
    async (orderId: string, nickname: string, orderCreatedAt?: string | number, initialAmount?: number) => {
      if (processedNotificationIdsRef.current.has(orderId)) return;

      if (orderCreatedAt) {
        const orderTime = typeof orderCreatedAt === 'number' ? orderCreatedAt : new Date(orderCreatedAt).getTime();
        if (!isNaN(orderTime) && orderTime < sessionMountTimeRef.current - 3000) {
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

      // 1. 若接單音效開啟：立即播放接單叮咚鈴聲
      if (isSoundEnabled) {
        playChimeSound();
      }

      showToast(`🔔 收到 ${nickname || '團員'} 的新訂單！`);

      // 2. 若語音報單開啟：抓取訂單明細並依音效狀態分流播報
      if (isSpeechEnabled) {
        (async () => {
          try {
            // 嘗試取得該筆訂單的品項清單（含微重試以防結帳品項寫入微小延遲）
            let itemRows: any[] = [];
            for (let attempt = 0; attempt < 3; attempt++) {
              const { data } = await supabase
                .from('order_items')
                .select('item_name, quantity, custom_notes, unit_price')
                .eq('submission_id', orderId);
              if (data && data.length > 0) {
                itemRows = data;
                break;
              }
              await new Promise((res) => setTimeout(res, 180));
            }

            let items: SpeechOrderItem[] = [];
            let totalAmount = initialAmount || 0;

            if (itemRows && itemRows.length > 0) {
              items = itemRows.map((r: any) => ({
                name: r.item_name,
                quantity: r.quantity,
                notes: r.custom_notes,
              }));
              if (!totalAmount) {
                totalAmount = itemRows.reduce((sum: number, r: any) => sum + (r.unit_price * r.quantity), 0);
              }
            }

            // ⚡ 核心分流：若音效沒開，immediate = true (0ms 立即直接語音朗讀)；若音效有開，immediate = false (延遲 750ms 等鈴聲結束)
            speakOrder(
              {
                orderId,
                nickname,
                total_amount: totalAmount,
                items,
              },
              !isSoundEnabled
            );
          } catch (err) {
            console.warn('語音報單抓取明細失敗，執行摘要播報:', err);
            speakOrder(
              {
                orderId,
                nickname,
                total_amount: initialAmount || 0,
                items: [],
              },
              !isSoundEnabled
            );
          }
        })();
      }
    },
    [isSoundEnabled, isSpeechEnabled, playChimeSound, speakOrder, showToast]
  );

  // ⚡ 根據選中的店家/活動在記憶體中即時過濾訂單，0ms 切換無重整或閃爍
  const submissions = useMemo(() => {
    if (!selectedActiveGroupId || selectedActiveGroupId === 'all') {
      return allSubmissions;
    }
    return allSubmissions.filter((s) => s.group_order_id === selectedActiveGroupId);
  }, [allSubmissions, selectedActiveGroupId]);

  // 抓取全域後台資料
  const fetchAdminData = useCallback(async (targetGroupId?: string, isSilent: boolean = true) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const [gRes, sRes, cRes, pRes, soRes, mRes, sortRes] = await Promise.all([
        supabase.from('group_orders').select(`*, stores (*)`).order('created_at', { ascending: false }),
        supabase.from('stores').select('*').order('name', { ascending: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('payment_methods').select('*').order('name', { ascending: true }),
        supabase.from('sold_out_options').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('name', { ascending: true }),
        fetch('/api/menu/sort-order', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      setStores((sRes.data as Store[]) || []);
      setCategories((cRes.data as Category[]) || []);
      setPaymentMethods((pRes.data as PaymentMethod[]) || []);
      setSoldOutOptions((soRes.data as SoldOutOption[]) || []);

      const rawMenuItems = (mRes.data as MenuItem[]) || [];
      const orderMap: Record<string, string[]> = sortRes?.orderMap || {};

      const sortedMenuItems = [...rawMenuItems].sort((a, b) => {
        if (a.store_id !== b.store_id) return 0;
        const storeOrder = orderMap[a.store_id] || [];
        const indexA = storeOrder.indexOf(a.id);
        const indexB = storeOrder.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.name.localeCompare(b.name, 'zh-TW');
      });

      setAllMenuItems(sortedMenuItems);

      if (gRes.data) {
        const allG = gRes.data;
        const openGroups = allG.filter((g) => g.status === 'open');
        const completedList = allG.filter((g) => g.status === 'completed');

        setArchivedGroups(completedList as GroupOrderAdmin[]);

        const effectiveGroupId = targetGroupId !== undefined ? targetGroupId : selectedActiveGroupIdRef.current;
        const openGroupIds = openGroups.map((g) => g.id);

        if (openGroupIds.length > 0) {
          const { data: allSubList, error: subErr } = await supabase
            .from('order_submissions')
            .select(`
              id, order_number, user_nickname, payment_method_name, sold_out_option,
              total_amount, final_amount, is_paid, signature_data, created_at, group_order_id,
              group_orders (title, stores (name)),
              order_items (id, item_name, quantity, unit_price, custom_notes)
            `)
            .in('group_order_id', openGroupIds)
            .order('created_at', { ascending: false });

          if (subErr) console.error('抓取訂單失敗:', subErr);

          const formattedSubs: OrderSubmissionAdmin[] = (allSubList || []).map((s: any) => ({
            ...s,
            store_name: s.group_orders?.stores?.name || s.group_orders?.title || '',
            order_items: s.order_items || [],
          }));

          (allSubList || []).forEach((s: any) => {
            knownOrderIdsRef.current.add(s.id);
            processedNotificationIdsRef.current.add(s.id);
          });

          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }

          const groupsWithStats: GroupOrderAdmin[] = openGroups.map((g: any) => {
            const gSubs = formattedSubs.filter((s) => s.group_order_id === g.id);
            return {
              ...g,
              order_count: gSubs.length,
              total_sales: gSubs.reduce((sum, s) => sum + s.final_amount, 0),
            };
          });

          setActiveGroups(groupsWithStats);

          let currentGroup: GroupOrderAdmin | null = null;
          if (effectiveGroupId && effectiveGroupId !== 'all') {
            currentGroup = groupsWithStats.find((g) => g.id === effectiveGroupId) || groupsWithStats[0];
          } else {
            currentGroup = groupsWithStats.find((g) => (g.order_count || 0) > 0) || groupsWithStats[0];
          }

          if (currentGroup) {
            setActiveGroup(currentGroup);
            setInputDeliveryFee(currentGroup.delivery_fee || 0);
            setInputDiscount(currentGroup.discount_amount || 0);
            setRoundingRule((currentGroup.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
          }

          setAllSubmissions(formattedSubs);
        } else {
          setActiveGroups([]);
          setActiveGroup(null);
          setAllSubmissions([]);
        }
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
          setTimeout(() => {
            fetchAdminData(selectedActiveGroupIdRef.current, true);
          }, 500);
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
    allSubmissions,
    setAllSubmissions,
    submissions,
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
