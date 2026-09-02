'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Category, MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
import { GroupOrderAdmin, OrderSubmissionAdmin } from '../admin-types';
import { SpeechOrderItem, SpeechOrderPayload } from './useAdminSpeech';

// 明確定義 Supabase 原始查詢回傳的型別（取代 any）
interface RawOrderItemRow {
  item_name: string;
  quantity: number;
  custom_notes: string | null;
  unit_price: number;
}

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

      // 1. 若接單音效開啟：立即播放接單叮咚鈴聲
      if (isSoundEnabled) {
        playChimeSound();
      }

      showToast(`收到 ${nickname || '團員'} 的新訂單！`);

      // 2. 若語音報單開啟：抓取訂單明細並依音效狀態分流播報
      if (isSpeechEnabled) {
        (async () => {
          try {
            // 嘗試取得該筆訂單的品項清單（含微重試以防結帳品項寫入微小延遲）
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

  // ⚡ 根據選中的店家/活動在記憶體中即時過濾訂單，0ms 切換無重整或閃爍（始終保留全部店家總覽）
  const submissions = useMemo(() => {
    if (!selectedActiveGroupId || selectedActiveGroupId === 'all') {
      return allSubmissions;
    }
    return allSubmissions.filter(
      (s) => s.store_id === selectedActiveGroupId || s.group_order_id === selectedActiveGroupId
    );
  }, [allSubmissions, selectedActiveGroupId]);

  // 抓取全域後台資料
  const fetchAdminData = useCallback(async (targetGroupId?: string, isSilent: boolean = true) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const [gRes, sRes, cRes, pRes, soRes, mRes, sortRes, storeCodeRes] = await Promise.all([
        supabase.from('group_orders').select(`*, stores (*)`).order('created_at', { ascending: false }),
        supabase.from('stores').select('*').order('name', { ascending: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('payment_methods').select('*').order('name', { ascending: true }),
        supabase.from('sold_out_options').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('name', { ascending: true }),
        fetch('/api/menu/sort-order', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      const rawStores = (sRes.data as Store[]) || [];
      const codeMap: Record<string, string> = storeCodeRes?.codeMap || {};

      // 智慧指派與綁定 S-??? 商家編號
      const existingUsedNumbers = new Set<number>();
      Object.values(codeMap).forEach((c) => {
        const num = parseInt(String(c).replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 0) existingUsedNumbers.add(num);
      });

      let nextAutoNum = 1;
      const formattedStores = rawStores.map((store) => {
        let code = codeMap[store.id];
        if (!code) {
          while (existingUsedNumbers.has(nextAutoNum)) {
            nextAutoNum++;
          }
          code = `S-${String(nextAutoNum).padStart(3, '0')}`;
          existingUsedNumbers.add(nextAutoNum);
        }
        return { ...store, code };
      });

      setStores(formattedStores);
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

      const allG = gRes.data || [];
      const completedList = allG.filter((g) => g.status === 'completed');
      setArchivedGroups(completedList as GroupOrderAdmin[]);

      const effectiveGroupId = targetGroupId !== undefined ? targetGroupId : selectedActiveGroupIdRef.current;

      // 抓取全站所有未歸檔即時訂單（嚴格適配 Supabase 實際 Schema）
      const { data: allSubList, error: subErr } = await supabase
        .from('order_submissions')
        .select(`
          id, order_number, user_nickname, payment_method_name, sold_out_option,
          total_amount, final_amount, is_paid, signature_data, created_at, group_order_id,
          group_orders (id, title, store_id, stores (id, name)),
          order_items (id, item_name, quantity, unit_price, custom_notes)
        `)
        .order('created_at', { ascending: false });

      if (subErr) console.error('抓取訂單失敗:', subErr);

      const rawSubRows = (allSubList as unknown as any[]) || [];
      const completedGroupIds = new Set(completedList.map((g) => g.id));
      const activeSubList = rawSubRows.filter((s) => {
        if (s.group_order_id && completedGroupIds.has(s.group_order_id)) return false;
        return true;
      });

      const storeMap = new Map(formattedStores.map((s) => [s.id, s]));
      const formattedSubs: OrderSubmissionAdmin[] = activeSubList.map((s: any) => {
        const resolvedStoreId =
          s.group_orders?.store_id ||
          s.group_orders?.stores?.id ||
          '';
        const matchedStore = storeMap.get(resolvedStoreId);
        const resolvedStoreName =
          matchedStore?.name ||
          s.group_orders?.stores?.name ||
          s.group_orders?.title ||
          '店家餐點';

        return {
          ...s,
          store_id: resolvedStoreId,
          store_name: resolvedStoreName,
          order_items: s.order_items || [],
        };
      });

      formattedSubs.forEach((s) => {
        knownOrderIdsRef.current.add(s.id);
        processedNotificationIdsRef.current.add(s.id);
      });

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }

      // 以店家為單位產生分流視圖，包含即時訂單數與營業額統計
      const storeGroupsWithStats: GroupOrderAdmin[] = formattedStores.map((store) => {
        const sSubs = formattedSubs.filter((s) => s.store_id === store.id || s.group_order_id === store.id);
        return {
          id: store.id,
          store_id: store.id,
          title: store.name,
          status: store.is_accepting_orders === false ? 'closed' : 'open',
          announcement: store.announcement || null,
          delivery_fee: 0,
          discount_amount: 0,
          rounding_rule: 'floor',
          enable_min_threshold: store.enable_min_threshold,
          min_threshold_amount: store.min_threshold_amount,
          enable_countdown: store.enable_countdown,
          cutoff_time: store.cutoff_time,
          enable_budget_limit: store.enable_budget_limit,
          budget_limit_amount: store.budget_limit_amount,
          stores: store,
          order_count: sSubs.length,
          total_sales: sSubs.reduce((sum, s) => sum + s.final_amount, 0),
        };
      });

      // 排序：有訂單的店家排在前面，接著是營業中的店家
      storeGroupsWithStats.sort((a, b) => {
        if ((a.order_count || 0) > 0 && (b.order_count || 0) === 0) return -1;
        if ((a.order_count || 0) === 0 && (b.order_count || 0) > 0) return 1;
        if (a.status === 'open' && b.status === 'closed') return -1;
        if (a.status === 'closed' && b.status === 'open') return 1;
        return a.title.localeCompare(b.title, 'zh-TW');
      });

      setActiveGroups(storeGroupsWithStats);

      let currentGroup: GroupOrderAdmin | null = null;
      if (effectiveGroupId && effectiveGroupId !== 'all') {
        currentGroup = storeGroupsWithStats.find((g) => g.id === effectiveGroupId) || null;
      }

      setActiveGroup(currentGroup);
      if (currentGroup) {
        setInputDeliveryFee(currentGroup.delivery_fee || 0);
        setInputDiscount(currentGroup.discount_amount || 0);
        setRoundingRule((currentGroup.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
      }

      setAllSubmissions(formattedSubs);
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

  // 🌟 樂觀更新特定店家菜單品項順序，杜絕非同步重抓造成的順序回彈
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

  // 🌟 儲存店家即時營運設定（公告、起送目標、倒數計時、接單狀態）
  const handleSaveStoreSettings = useCallback(
    async (storeId: string, updatedData: Partial<Store>) => {
      try {
        // 1. 若有基礎店家欄位 (name, category_id, image_url, is_active)，更新 stores 表
        const storeBasePayload: any = {};
        if (updatedData.name !== undefined) storeBasePayload.name = updatedData.name;
        if (updatedData.category_id !== undefined) storeBasePayload.category_id = updatedData.category_id;
        if (updatedData.image_url !== undefined) storeBasePayload.image_url = updatedData.image_url;
        if (updatedData.is_active !== undefined) storeBasePayload.is_active = updatedData.is_active;

        if (Object.keys(storeBasePayload).length > 0) {
          const { error: storeErr } = await supabase
            .from('stores')
            .update(storeBasePayload)
            .eq('id', storeId);
          if (storeErr) console.warn('更新 stores 基本資訊略過:', storeErr);
        }

        // 2. 更新 group_orders 營運設定（公告、免運目標、倒數計時、接單狀態）
        const groupPayload: any = {};
        if (updatedData.announcement !== undefined) groupPayload.announcement = updatedData.announcement;
        if (updatedData.enable_min_threshold !== undefined) groupPayload.enable_min_threshold = updatedData.enable_min_threshold;
        if (updatedData.min_threshold_amount !== undefined) groupPayload.min_threshold_amount = updatedData.min_threshold_amount;
        if (updatedData.enable_countdown !== undefined) groupPayload.enable_countdown = updatedData.enable_countdown;
        if (updatedData.cutoff_time !== undefined) groupPayload.cutoff_time = updatedData.cutoff_time;
        if (updatedData.is_accepting_orders !== undefined) groupPayload.status = updatedData.is_accepting_orders ? 'open' : 'closed';

        if (Object.keys(groupPayload).length > 0) {
          const { error: grpErr } = await supabase
            .from('group_orders')
            .update(groupPayload)
            .eq('store_id', storeId)
            .neq('status', 'completed');
          if (grpErr) throw grpErr;
        }

        showToast('店家即時營運設定已成功儲存！');
        fetchAdminData(selectedActiveGroupIdRef.current, true);
      } catch (err: any) {
        console.error('儲存店家營運設定失敗:', err);
        showToast(`儲存失敗：${err?.message || err}`);
        throw err;
      }
    },
    [fetchAdminData, showToast]
  );

  // 🌟 一鍵切換店家營業接單 / 暫停接單狀態
  const handleToggleStoreAccepting = useCallback(
    async (storeId: string, newAccepting: boolean) => {
      try {
        const { error } = await supabase
          .from('group_orders')
          .update({ status: newAccepting ? 'open' : 'closed' })
          .eq('store_id', storeId)
          .neq('status', 'completed');

        if (error) throw error;

        showToast(newAccepting ? '已恢復店家營業接單！' : '已暫停該店家接單！');
        fetchAdminData(selectedActiveGroupIdRef.current, true);
      } catch (err: any) {
        console.error('切換接單狀態失敗:', err);
        showToast(`切換失敗：${err?.message || err}`);
      }
    },
    [fetchAdminData, showToast]
  );

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
    loading,
    fetchAdminData,
    handleSaveStoreSettings,
    handleToggleStoreAccepting,
    inputDeliveryFee,
    setInputDeliveryFee,
    inputDiscount,
    setInputDiscount,
    roundingRule,
    setRoundingRule,
  };
}
