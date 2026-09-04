'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { CartItem, MultiStoreCart } from '@/types/cart';
import { parseOrderProgressStatus } from '@/types/orderStatus';
import { formatErrorMessage } from '@/lib/errorUtils';

export interface OrderItemDetail {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

export interface OrderSubmissionDetail {
  id: string;
  group_order_id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  signature_url?: string | null;
  signature_data?: string | null;
  created_at: string;
}

export interface GroupOrderMeta {
  id: string;
  store_id: string;
  status: 'open' | 'closed' | 'completed';
  stores?: {
    id: string;
    name: string;
  };
}

export function useOrderStatus(submissionId: string) {
  const router = useRouter();

  // ⚡ 優先自 SessionStorage 讀取背景預載入快取，達成 0ms 瞬開
  const [order, setOrder] = useState<OrderSubmissionDetail | null>(() => {
    if (typeof window !== 'undefined' && submissionId) {
      try {
        const raw = sessionStorage.getItem(`meinu_order_cache_${submissionId}`);
        if (raw) return JSON.parse(raw).order || null;
      } catch {}
    }
    return null;
  });

  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>(() => {
    if (typeof window !== 'undefined' && submissionId) {
      try {
        const raw = sessionStorage.getItem(`meinu_order_cache_${submissionId}`);
        if (raw) return JSON.parse(raw).orderItems || [];
      } catch {}
    }
    return [];
  });

  const [groupOrder, setGroupOrder] = useState<GroupOrderMeta | null>(() => {
    if (typeof window !== 'undefined' && submissionId) {
      try {
        const raw = sessionStorage.getItem(`meinu_order_cache_${submissionId}`);
        if (raw) return JSON.parse(raw).groupOrder || null;
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => !order);

  // 限時 1 分鐘自主修改/取消倒數
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // 🔒 擁有者鑑權防護
  const [isOrderOwner] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && submissionId) {
      try {
        const lastId = localStorage.getItem('menu_app_last_order_id');
        if (lastId === submissionId) return true;
        const historyRaw = localStorage.getItem('menu_app_order_history');
        if (historyRaw) {
          const list: string[] = JSON.parse(historyRaw);
          return list.includes(submissionId);
        }
      } catch {}
    }
    return false;
  });

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    type: 'modify' | 'cancel';
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
  }>({
    isOpen: false,
    type: 'modify',
    title: '',
    message: '',
    confirmText: '',
    isDanger: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // 1. 抓取訂單主檔與明細
  useEffect(() => {
    if (!submissionId) return;

    async function fetchOrder() {
      if (!order) setLoading(true);

      const { data: subData, error: subErr } = await supabase
        .from('order_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (subErr || !subData) {
        console.error(subErr);
        setLoading(false);
        return;
      }

      setOrder(subData as OrderSubmissionDetail);

      const { data: grpData } = await supabase
        .from('group_orders')
        .select('id, store_id, status, stores(id, name)')
        .eq('id', subData.group_order_id)
        .single();

      if (grpData) {
        setGroupOrder(grpData as unknown as GroupOrderMeta);
      }

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('id, item_name, quantity, unit_price, custom_notes')
        .eq('submission_id', submissionId);

      if (itemsData) {
        setOrderItems(itemsData);
      }

      // 計算剩餘秒數
      if (subData.created_at) {
        const orderTime = new Date(subData.created_at).getTime();
        const now = new Date().getTime();
        const elapsedSec = Math.floor((now - orderTime) / 1000);
        const remaining = Math.max(0, 60 - elapsedSec);
        setTimeLeft(remaining);
      }

      setLoading(false);
    }

    fetchOrder();

    // 2. Realtime 實時監聽與 3 秒輪詢雙保險
    const channel = supabase
      .channel(`order_status_${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_submissions',
          filter: `id=eq.${submissionId}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder((prev) => (prev ? { ...prev, ...(payload.new as OrderSubmissionDetail) } : null));
          }
        }
      )
      .subscribe();

    const pollingInterval = setInterval(async () => {
      try {
        const { data: latestSub } = await supabase
          .from('order_submissions')
          .select('id, is_paid, signature_url, signature_data, final_amount, total_amount')
          .eq('id', submissionId)
          .maybeSingle();

        if (latestSub) {
          setOrder((prev) => (prev ? { ...prev, ...latestSub } : null));
        }
      } catch {}
    }, 3000);

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  // 3. 1分鐘倒數計時
  useEffect(() => {
    if (timeLeft <= 0 || isTimerPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isTimerPaused]);

  const cleanLocalHistory = () => {
    localStorage.removeItem('menu_app_last_order_id');
    try {
      const historyRaw = localStorage.getItem('menu_app_order_history');
      if (historyRaw) {
        const historyList: string[] = JSON.parse(historyRaw);
        const filtered = historyList.filter((id) => id !== submissionId);
        localStorage.setItem('menu_app_order_history', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModifyModal = () => {
    setConfirmModalConfig({
      isOpen: true,
      type: 'modify',
      title: '確認要修改這筆訂單嗎？',
      message:
        '系統會將您點的餐點完整還原回購物車，並取消此筆訂單，讓您可以直接重新調整規格、甜度冰塊或品項！',
      confirmText: '還原回購物車修改',
      isDanger: false,
    });
  };

  const handleOpenCancelModal = () => {
    setConfirmModalConfig({
      isOpen: true,
      type: 'cancel',
      title: '確認要取消這筆訂單嗎？',
      message: '取消後此筆單號將被註銷。若您之後仍想用餐，可以重新到菜單挑選送單。',
      confirmText: '確認取消訂單',
      isDanger: true,
    });
  };

  const handleExecuteModalAction = async () => {
    if (!isOrderOwner) {
      showToast('權限限制：此訂單不屬於此裝置，無法執行修改或取消操作！');
      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const currentProgress = order ? parseOrderProgressStatus(order.signature_url) : 'pending';
    if (currentProgress !== 'pending') {
      showToast('店家已在處理製作餐點中，無法取消或修改訂單！');
      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
    setIsActionLoading(true);

    try {
      if (confirmModalConfig.type === 'modify') {
        const storeId = groupOrder?.store_id || 'unknown_store';
        const storeName = groupOrder?.stores?.name || '店家';

        const restoredItems: CartItem[] = orderItems.map((item, idx) => ({
          cartItemId: `restore-${item.id}-${idx}`,
          menuItemId: item.id,
          storeId,
          storeName,
          name: item.item_name,
          unitPrice: item.unit_price,
          quantity: item.quantity,
          selectedOptions: [],
          customNotes: item.custom_notes || '',
          totalPrice: item.unit_price * item.quantity,
        }));

        const savedMulti = localStorage.getItem('menu_app_multi_cart');
        const parsed: MultiStoreCart = savedMulti ? JSON.parse(savedMulti) : {};
        parsed[storeId] = {
          storeId,
          storeName,
          items: restoredItems,
        };
        localStorage.setItem('menu_app_multi_cart', JSON.stringify(parsed));

        await supabase.from('order_items').delete().eq('submission_id', submissionId);
        const { error: delSubErr } = await supabase.from('order_submissions').delete().eq('id', submissionId);
        if (delSubErr) throw delSubErr;

        cleanLocalHistory();
        showToast('已成功將品項還原回購物車！正在前往購物車...');
        setTimeout(() => router.push('/cart'), 500);
      } else {
        await supabase.from('order_items').delete().eq('submission_id', submissionId);
        const { error } = await supabase.from('order_submissions').delete().eq('id', submissionId);
        if (error) throw error;

        cleanLocalHistory();
        showToast('訂單已順利取消！正在返回首頁大廳...');
        setTimeout(() => router.push('/'), 500);
      }
    } catch (e) {
      console.error(e);
      showToast(formatErrorMessage(e, '操作失敗，可能訂單已被處理或網路不穩，請稍後重試'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const isClosed = groupOrder?.status === 'closed' || groupOrder?.status === 'completed';
  const isTimeUp = timeLeft === 0;
  const isActionDisabled = isTimeUp || isClosed || isActionLoading;

  return {
    order,
    orderItems,
    groupOrder,
    loading,
    timeLeft,
    isClosed,
    isActionDisabled,
    isOrderOwner,
    toastMessage,
    confirmModalConfig,
    setConfirmModalConfig,
    setIsTimerPaused,
    handleOpenModifyModal,
    handleOpenCancelModal,
    handleExecuteModalAction,
  };
}
