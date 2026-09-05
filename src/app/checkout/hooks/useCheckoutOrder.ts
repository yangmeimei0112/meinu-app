'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import { PaymentMethod, SoldOutOption, GroupOrder } from '@/types/database';
import { sanitizeInput, checkRateLimit, isHumanInteractionTime } from '@/lib/security';
import { executeOrderSubmissionPipeline } from '../services/orderSubmissionService';
import { formatErrorMessage } from '@/lib/errorUtils';

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
  const [signatureData, setSignatureData] = useState<string | null>(null);

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

    // 伺服端速率限制：同暱稱在最近 5 分鐘內的訂單筆數，超過 5 筆視為異常
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
        console.warn('[Security] Server-side rate check failed, proceeding:', rateCheckErr);
      }
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('menu_app_user_nickname', cleanNickname);

      const result = await executeOrderSubmissionPipeline({
        targetStoreId,
        cartItems,
        cleanNickname,
        selectedPayment,
        selectedSoldOut,
        activeGroupOrder,
        grandTotal,
        signatureData,
      });

      setSuccessModalData({
        isOpen: true,
        orderNumber: result.orderNumber,
        submissionId: result.submissionId,
        storeName: result.storeName,
        totalAmount: result.totalAmount,
      });
    } catch (err: any) {
      console.error('送單出錯:', err);
      showToast(formatErrorMessage(err, '送出失敗，請重試或檢查網路連線'));
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
    signatureData,
    setSignatureData,
    honeypotTrap,
    setHoneypotTrap,
    toastMessage,
    isSubmitting,
    successModalData,
    grandTotal,
    handleCopyAccount,
    handleSubmitOrder,
  };
}
