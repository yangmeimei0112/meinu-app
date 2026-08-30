'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import { PaymentMethod, SoldOutOption, GroupOrder } from '@/types/database';
import { sanitizeInput, checkRateLimit, isHumanInteractionTime } from '@/lib/security';
import { generateSequentialOrderNumber } from '@/lib/order-utils';

interface UseCheckoutOrderProps {
  targetStoreId: string;
}

export function useCheckoutOrder({ targetStoreId }: UseCheckoutOrderProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [soldOutOptions, setSoldOutOptions] = useState<SoldOutOption[]>([]);
  const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrder | null>(null);

  const [nickname, setNickname] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedSoldOut, setSelectedSoldOut] = useState<string>('');
  const [hasDuplicateNickname, setHasDuplicateNickname] = useState<boolean>(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState<boolean>(false);

  // 🛡️ 資安防護：蜜罐陷阱欄位與人類互動載入時間戳
  const [honeypotTrap, setHoneypotTrap] = useState<string>('');
  const [pageLoadTime, setPageLoadTime] = useState<number>(0);

  useEffect(() => {
    setPageLoadTime(Date.now());
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [successModalData, setSuccessModalData] = useState<{
    isOpen: boolean;
    orderNumber: string;
    submissionId: string;
    storeName?: string;
    totalAmount?: number;
  }>({
    isOpen: false,
    orderNumber: '',
    submissionId: '',
  });

  const [duplicateConfirmModal, setDuplicateConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '確定',
    cancelText: '取消',
    onConfirm: () => {},
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // 1. 載入購物車與儲存的暱稱
  useEffect(() => {
    const savedMulti = localStorage.getItem('menu_app_multi_cart');
    if (savedMulti) {
      try {
        const parsed: MultiStoreCart = JSON.parse(savedMulti);
        const key = targetStoreId || Object.keys(parsed)[0];
        if (key && parsed[key]) {
          setCartItems(parsed[key].items);
        }
      } catch (e) {
        console.error('讀取多店家購物車失敗', e);
      }
    }

    const savedNickname = localStorage.getItem('menu_app_user_nickname');
    if (savedNickname) setNickname(savedNickname);
  }, [targetStoreId]);

  // 2. 抓取付款方式、缺貨備案與團購活動
  useEffect(() => {
    async function fetchCheckoutMeta() {
      const { data: pmData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      const { data: soData } = await supabase
        .from('sold_out_options')
        .select('*')
        .order('sort_order', { ascending: true });

      if (pmData) {
        setPaymentMethods(pmData);
        if (pmData.length > 0) setSelectedPayment(pmData[0].name);
      }

      if (soData) {
        setSoldOutOptions(soData);
        if (soData.length > 0) setSelectedSoldOut(soData[0].name);
      }

      const storeId = targetStoreId || cartItems[0]?.storeId;
      if (storeId) {
        const { data: grpData } = await supabase
          .from('group_orders')
          .select('*')
          .eq('store_id', storeId)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (grpData) {
          setActiveGroupOrder(grpData);
        }
      }
    }

    fetchCheckoutMeta();
  }, [targetStoreId, cartItems]);

  // 3. 檢查重複暱稱
  useEffect(() => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setHasDuplicateNickname(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        let query = supabase
          .from('order_submissions')
          .select('id')
          .ilike('user_nickname', trimmed);

        if (activeGroupOrder) {
          query = query.eq('group_order_id', activeGroupOrder.id);
        }

        const { data } = await query;
        setHasDuplicateNickname(!!(data && data.length > 0));
      } catch (err) {
        console.error('檢查暱稱重複失敗', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nickname, activeGroupOrder]);

  const handleCopyAccount = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      showToast('已複製轉帳帳號至剪貼簿！');
    },
    [showToast]
  );

  const grandTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // 4. 提交訂單處理
  const handleSubmitOrder = async () => {
    if (!isHumanInteractionTime(pageLoadTime, 1200)) {
      showToast('操作過於頻繁，請稍後再試');
      return;
    }

    // 🛡️ 檢查全站/結帳頁維護狀態，維護中禁止送單
    try {
      const maintRes = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (maintRes.ok) {
        const mData = await maintRes.json();
        const isCheckoutBlocked = mData?.is_maintenance && (!mData.scope || mData.scope === 'all' || mData.scope === 'checkout');
        if (isCheckoutBlocked) {
          showToast(mData.message || '網站系統目前維護中，暫停受理新訂單！');
          return;
        }
      }
    } catch {}

    if (honeypotTrap) {
      console.warn('[Security] Honeypot triggered in checkout');
      showToast('送單請求無效');
      return;
    }

    const rateLimitResult = checkRateLimit('checkout_submit', 5, 60000);
    if (!rateLimitResult.allowed) {
      showToast(rateLimitResult.reason || '您的操作次數過多，請稍候 1 分鐘後再送單');
      return;
    }

    const cleanNickname = sanitizeInput(nickname, 30);
    if (!cleanNickname) {
      showToast('請輸入訂購人暱稱！');
      return;
    }

    if (cartItems.length === 0) {
      showToast('購物車內沒有餐點！');
      return;
    }

    if (!selectedPayment) {
      showToast('請選擇付款方式！');
      return;
    }

    if (!selectedSoldOut) {
      showToast('請選擇缺貨時的處理方式！');
      return;
    }

    // 🛡️ M1 修復：伺服端速率限制（補強純客戶端 localStorage 可被清除繞過的弱點）
    // 查詢同暱稱在最近 5 分鐘內的訂單筆數，超過 5 筆視為異常刷單行為
    if (activeGroupOrder?.id && cleanNickname) {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('order_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('group_order_id', activeGroupOrder.id)
          .ilike('user_nickname', cleanNickname)
          .gte('created_at', fiveMinutesAgo);

        if (count !== null && count >= 5) {
          showToast('您在近期已多次送出訂單，請稍候 5 分鐘後再試，或聯繫團長協助處理。');
          return;
        }
      } catch (rateCheckErr) {
        // 伺服端速率查詢失敗不阻斷正常流程，降級繼續
        console.warn('[Security] Server-side rate check failed, proceeding:', rateCheckErr);
      }
    }

    if (hasDuplicateNickname) {
      setDuplicateConfirmModal({
        isOpen: true,
        title: '暱稱重複提醒',
        message: `目前已有成員使用「${cleanNickname}」點餐。為避免核帳混淆，請問您是否為同一位訂購人追加餐點，或需要更換辨識暱稱？`,
        confirmText: '確定以此暱稱送出',
        cancelText: '我回去修改暱稱',
        onConfirm: () => {
          setDuplicateConfirmModal((prev) => ({ ...prev, isOpen: false }));
          executeOrderSubmission(cleanNickname);
        },
      });
      return;
    }

    executeOrderSubmission(cleanNickname);
  };

  const executeOrderSubmission = async (cleanNickname: string) => {
    setIsSubmitting(true);
    try {
      localStorage.setItem('menu_app_user_nickname', cleanNickname);

      const storeId = targetStoreId || cartItems[0]?.storeId;
      if (!storeId) throw new Error('缺少店家資訊');

      let activeGroupId = activeGroupOrder?.id;

      if (!activeGroupId) {
        const { data: existingGroup } = await supabase
          .from('group_orders')
          .select('id')
          .eq('store_id', storeId)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingGroup) {
          activeGroupId = existingGroup.id;
        } else {
          const { data: newGroup, error: groupErr } = await supabase
            .from('group_orders')
            .insert([
              {
                store_id: storeId,
                title: `${cartItems[0]?.storeName || '美味餐點'} 點餐團`,
                status: 'open',
              },
            ])
            .select('id')
            .single();
          if (groupErr || !newGroup) throw groupErr || new Error('自動開啟團購失敗');
          activeGroupId = (newGroup as { id: string }).id;
        }
      }

      if (!activeGroupId) {
        throw new Error('無法取得或建立有效之團購活動');
      }

      const orderNumber = await generateSequentialOrderNumber(supabase, activeGroupId);
      const safeGrandTotal = Math.max(0, Math.round(grandTotal));

      const { data: submission, error: subErr } = await supabase
        .from('order_submissions')
        .insert([
          {
            group_order_id: activeGroupId,
            user_nickname: cleanNickname,
            payment_method_name: sanitizeInput(selectedPayment, 40),
            sold_out_option: sanitizeInput(selectedSoldOut, 40),
            total_amount: safeGrandTotal,
            final_amount: safeGrandTotal,
            order_number: orderNumber,
            is_paid: false,
          },
        ])
        .select('id')
        .single();

      if (subErr || !submission) throw subErr || new Error('建立訂單記錄失敗');

      const itemsPayload = cartItems.map((item) => ({
        submission_id: submission.id,
        item_name: sanitizeInput(item.name, 60),
        quantity: Math.max(1, Math.min(99, item.quantity)),
        unit_price: Math.max(0, Math.round(item.unitPrice)),
        custom_notes: item.customNotes ? sanitizeInput(item.customNotes, 100) : null,
      }));

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsPayload)
        .select('id');

      if (itemsErr) throw itemsErr;

      if (insertedItems) {
        const optionsPayload: Array<{
          order_item_id: string;
          option_name: string;
          extra_price: number;
        }> = [];

        insertedItems.forEach((dbItem, idx) => {
          const cartItem = cartItems[idx];
          if (cartItem && cartItem.selectedOptions) {
            cartItem.selectedOptions.forEach((opt) => {
              optionsPayload.push({
                order_item_id: dbItem.id,
                option_name: sanitizeInput(opt.itemName, 40),
                extra_price: Math.max(0, Math.round(opt.extraPrice)),
              });
            });
          }
        });

        if (optionsPayload.length > 0) {
          await supabase.from('order_item_options').insert(optionsPayload);
        }
      }

      // 送單成功後，從多店家購物車中移除該店家
      const savedMulti = localStorage.getItem('menu_app_multi_cart');
      if (savedMulti) {
        const parsed: MultiStoreCart = JSON.parse(savedMulti);
        delete parsed[storeId];
        localStorage.setItem('menu_app_multi_cart', JSON.stringify(parsed));
      }

      // 儲存至單一最新與歷史訂單清單
      localStorage.setItem('menu_app_last_order_id', submission.id);
      localStorage.setItem('menu_app_has_new_order', 'true');
      try {
        const historyRaw = localStorage.getItem('menu_app_order_history');
        const historyList: string[] = historyRaw ? JSON.parse(historyRaw) : [];
        if (!historyList.includes(submission.id)) {
          historyList.unshift(submission.id);
          localStorage.setItem('menu_app_order_history', JSON.stringify(historyList.slice(0, 50)));
        }
      } catch (e) {
        console.error(e);
      }
      try {
        window.dispatchEvent(new Event('menu_app_orders_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch {}

      // ⚡ 建立訂單背景預載入快取（跳轉至訂單狀態頁 0ms 瞬開）
      try {
        const preloadedCache = {
          order: {
            id: submission.id,
            group_order_id: activeGroupId,
            order_number: orderNumber,
            user_nickname: cleanNickname,
            payment_method_name: sanitizeInput(selectedPayment, 40),
            sold_out_option: sanitizeInput(selectedSoldOut, 40),
            total_amount: safeGrandTotal,
            final_amount: safeGrandTotal,
            is_paid: false,
            created_at: new Date().toISOString(),
          },
          orderItems: itemsPayload.map((item, idx) => ({
            id: insertedItems?.[idx]?.id || `item-${idx}`,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            custom_notes: item.custom_notes || null,
          })),
          groupOrder: activeGroupOrder
            ? {
                id: activeGroupOrder.id,
                store_id: activeGroupOrder.store_id,
                status: activeGroupOrder.status,
                stores: {
                  id: activeGroupOrder.store_id,
                  name: cartItems[0]?.storeName || '店家',
                },
              }
            : null,
        };
        sessionStorage.setItem(`meinu_order_cache_${submission.id}`, JSON.stringify(preloadedCache));
      } catch (e) {
        console.error('儲存訂單預載快取失敗', e);
      }

      setSuccessModalData({
        isOpen: true,
        orderNumber,
        submissionId: submission.id,
        storeName: cartItems[0]?.storeName || '',
        totalAmount: safeGrandTotal,
      });
    } catch (err) {
      console.error(err);
      showToast('送出失敗，請重試或檢查網路連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    cartItems,
    paymentMethods,
    soldOutOptions,
    activeGroupOrder,
    nickname,
    setNickname,
    selectedPayment,
    setSelectedPayment,
    selectedSoldOut,
    setSelectedSoldOut,
    checkingDuplicate,
    hasDuplicateNickname,
    honeypotTrap,
    setHoneypotTrap,
    toastMessage,
    isSubmitting,
    successModalData,
    duplicateConfirmModal,
    setDuplicateConfirmModal,
    grandTotal,
    handleCopyAccount,
    handleSubmitOrder,
  };
}
