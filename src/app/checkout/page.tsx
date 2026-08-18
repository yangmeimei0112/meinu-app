'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import { PaymentMethod, SoldOutOption, GroupOrder } from '@/types/database';
import { sanitizeInput, checkRateLimit, isHumanInteractionTime } from '@/lib/security';
import { generateSequentialOrderNumber } from '@/lib/order-utils';
import CheckoutSummary from './components/CheckoutSummary';
import CheckoutOptions from './components/CheckoutOptions';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetStoreId = searchParams.get('storeId') || '';

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
  const [pageLoadTime] = useState<number>(() => Date.now());

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

  // 1. 載入指定店家的購物車品項與暱稱
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

  // 2. 抓取付款方式、缺貨備案與團購活動資訊
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

      if (pmData && pmData.length > 0) {
        setPaymentMethods(pmData as PaymentMethod[]);
        setSelectedPayment(pmData[0].name);
      }
      if (soData && soData.length > 0) {
        setSoldOutOptions(soData as SoldOutOption[]);
        setSelectedSoldOut(soData[0].title);
      }

      if (targetStoreId) {
        const { data: groupData } = await supabase
          .from('group_orders')
          .select('*')
          .eq('store_id', targetStoreId)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        if (groupData && groupData.length > 0) {
          setActiveGroupOrder(groupData[0] as GroupOrder);
        }
      }
    }

    fetchCheckoutMeta();
  }, [targetStoreId]);

  // 3. 同暱稱防撞名提醒（僅提醒，不阻擋）
  useEffect(() => {
    let isCancelled = false;

    async function checkDuplicateNickname() {
      const trimmedNickname = nickname.trim();
      if (!trimmedNickname || cartItems.length === 0) {
        setHasDuplicateNickname(false);
        return;
      }

      setCheckingDuplicate(true);
      try {
        const storeId = cartItems[0].storeId;
        const { data: existingGroup } = await supabase
          .from('group_orders')
          .select('id, status')
          .eq('store_id', storeId)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);

        const group = existingGroup?.[0];
        if (!group || group.status === 'completed') {
          if (!isCancelled) setHasDuplicateNickname(false);
          return;
        }

        const { data: duplicateRows } = await supabase
          .from('order_submissions')
          .select('id')
          .eq('group_order_id', group.id)
          .ilike('user_nickname', trimmedNickname)
          .limit(1);

        if (!isCancelled) {
          setHasDuplicateNickname((duplicateRows?.length || 0) > 0);
        }
      } finally {
        if (!isCancelled) setCheckingDuplicate(false);
      }
    }

    checkDuplicateNickname();

    return () => {
      isCancelled = true;
    };
  }, [nickname, cartItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('📋 已複製帳號資訊至剪貼簿！');
  };

  const grandTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmitOrder = async () => {
    // 🛡️ 1. 蜜罐陷阱檢查：自動化爬蟲機器人常自動填充所有 input 欄位
    if (honeypotTrap.trim()) {
      console.warn('Bot detected via honeypot trap');
      setIsSubmitting(false);
      showToast('⚠️ 系統防護攔截：偵測到異常請求');
      return;
    }

    // 🛡️ 2. 人類操作時間閾值檢查：防止腳本在開啟網頁後極速自動送單
    if (!isHumanInteractionTime(pageLoadTime, 1000)) {
      showToast('⚠️ 操作速度過快，請稍候 1 秒後再點擊送單！');
      return;
    }

    // 🛡️ 3. 客戶端送單頻率防刷單限制 (Rate Limit)
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      showToast(rateCheck.reason || '⚠️ 操作過於頻繁，請稍候再試！');
      return;
    }

    // 🛡️ 4. XSS 輸入清洗與長度限制
    const cleanNickname = sanitizeInput(nickname, 30);
    if (!cleanNickname) {
      showToast('⚠️ 請填寫您的有效暱稱，方便團長對帳！');
      return;
    }

    if (cartItems.length === 0) {
      showToast('⚠️ 購物車是空的，請先挑選餐點！');
      return;
    }

    setIsSubmitting(true);

    try {
      localStorage.setItem('menu_app_user_nickname', cleanNickname);

      const storeId = cartItems[0].storeId;
      const storeName = cartItems[0].storeName;

      let activeGroupId = '';
      const { data: existingGroup } = await supabase
        .from('group_orders')
        .select('id, status')
        .eq('store_id', storeId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingGroup && existingGroup.length > 0) {
        if (existingGroup[0].status === 'closed') {
          showToast('🚫 團長已截單，目前停止收單中！無法送出訂單。');
          setIsSubmitting(false);
          return;
        }
        activeGroupId = existingGroup[0].id;
      } else {
        const { data: newGroup, error: groupErr } = await supabase
          .from('group_orders')
          .insert({
            title: `${storeName} 團購活動`,
            store_id: storeId,
            status: 'open',
          })
          .select('id')
          .single();

        if (groupErr || !newGroup) throw new Error('建立團購活動失敗');
        activeGroupId = newGroup.id;
      }

      // 同暱稱防撞二次確認
      const { data: duplicateRows } = await supabase
        .from('order_submissions')
        .select('id')
        .eq('group_order_id', activeGroupId)
        .ilike('user_nickname', cleanNickname)
        .limit(1);

      if ((duplicateRows?.length || 0) > 0) {
        setDuplicateConfirmModal({
          isOpen: true,
          title: '⚠️ 發現同名訂單提醒',
          message: `目前已有一位「${cleanNickname}」送單囉！建議加上姓氏或代號（例如：戴小明、小明B）避免對帳混淆。確定要繼續以此暱稱送單嗎？`,
          confirmText: '繼續以此暱稱送單',
          cancelText: '返回修改暱稱',
          onConfirm: () => {
            setDuplicateConfirmModal((prev) => ({ ...prev, isOpen: false }));
            executeFinalOrderSubmission(cleanNickname, activeGroupId);
          },
        });
        setIsSubmitting(false);
        return;
      }

      await executeFinalOrderSubmission(cleanNickname, activeGroupId);
    } catch (err) {
      console.error(err);
      showToast('❌ 送出失敗，請重試或檢查網路連線');
      setIsSubmitting(false);
    }
  };

  // 實際執行訂單寫入流程
  const executeFinalOrderSubmission = async (cleanNickname: string, activeGroupId: string) => {
    setIsSubmitting(true);
    try {
      const storeId = cartItems[0].storeId;

      // 🔢 規律化循序單號生成 (MN-001, MN-002, MN-003 ...)
      const orderNumber = await generateSequentialOrderNumber(supabase, activeGroupId);
      const numGrandTotal = Number(grandTotal);
      const safeGrandTotal = Number.isFinite(numGrandTotal)
        ? Math.max(0, Math.min(999999, Math.round(numGrandTotal)))
        : 0;

      const { data: submission, error: subErr } = await supabase
        .from('order_submissions')
        .insert({
          group_order_id: activeGroupId,
          order_number: orderNumber,
          user_nickname: cleanNickname,
          payment_method_name: sanitizeInput(selectedPayment, 40),
          sold_out_option: sanitizeInput(selectedSoldOut, 40),
          total_amount: safeGrandTotal,
          final_amount: safeGrandTotal,
          is_paid: false,
        })
        .select('id')
        .single();

      if (subErr || !submission) throw new Error('建立訂單失敗');

      // 批次寫入所有訂單餐點項目（進行安全清洗與雙向極限數值鉗制）
      const itemsPayload = cartItems.map((item) => {
        const cleanItemName = sanitizeInput(item.name, 60);
        const cleanNotes = sanitizeInput(item.customNotes, 150);
        const customOptionText = (item.selectedOptions || [])
          .map((opt) => `${sanitizeInput(opt.groupTitle, 30)}:${sanitizeInput(opt.itemName, 30)}`)
          .join(', ');
        
        const numQty = Number(item.quantity);
        const safeQuantity = Number.isFinite(numQty)
          ? Math.max(1, Math.min(99, Math.floor(numQty)))
          : 1;

        const numPrice = Number(item.unitPrice);
        const safeUnitPrice = Number.isFinite(numPrice)
          ? Math.max(0, Math.min(99999, Math.round(numPrice)))
          : 0;

        return {
          submission_id: submission.id,
          item_name: cleanItemName,
          quantity: safeQuantity,
          unit_price: safeUnitPrice,
          custom_notes: cleanNotes
            ? `${customOptionText} | 備註: ${cleanNotes}`
            : customOptionText,
        };
      });

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsPayload)
        .select('id, item_name');

      if (!itemsErr && insertedItems) {
        // 寫入規格選項
        const optionsPayload: { order_item_id: string; option_name: string; extra_price: number }[] = [];
        insertedItems.forEach((orderItem, idx) => {
          const originalCartItem = cartItems[idx];
          if (originalCartItem?.selectedOptions) {
            originalCartItem.selectedOptions.forEach((opt) => {
              const numExtra = Number(opt.extraPrice);
              const safeExtra = Number.isFinite(numExtra)
                ? Math.max(0, Math.min(99999, Math.round(numExtra)))
                : 0;

              optionsPayload.push({
                order_item_id: orderItem.id,
                option_name: `${sanitizeInput(opt.groupTitle, 30)}: ${sanitizeInput(opt.itemName, 30)}`,
                extra_price: safeExtra,
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

      // 儲存至單一最新與歷史訂單清單 (供「我的訂單」頁面查詢)
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

      // ⚡ 建立訂單背景預載入快取（讓轉場結束跳轉至訂單頁時達成 0ms 瞬開，完全不顯示載入骨架）
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

      // 啟動精緻可愛的送單成功動態轉場視窗（取代瀏覽器原生 alert 彈窗）
      setSuccessModalData({
        isOpen: true,
        orderNumber,
        submissionId: submission.id,
        storeName: cartItems[0]?.storeName || '',
        totalAmount: safeGrandTotal,
      });
    } catch (err) {
      console.error(err);
      showToast('❌ 送出失敗，請重試或檢查網路連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          ‹ 返回購物車修改品項
        </Link>

        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">📋 確認點餐與結帳</h2>

        {/* 🍯 蜜罐陷阱欄位：視覺不可見，專門捕捉盲目填充的自動化腳本 */}
        <div aria-hidden="true" style={{ opacity: 0, position: 'absolute', top: -9999, left: -9999, height: 0, width: 0, zIndex: -1, overflow: 'hidden' }}>
          <label htmlFor="user_website_trap">請勿填寫此欄位</label>
          <input
            id="user_website_trap"
            type="text"
            name="user_website_trap"
            tabIndex={-1}
            autoComplete="off"
            value={honeypotTrap}
            onChange={(e) => setHoneypotTrap(e.target.value)}
          />
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">購物車目前沒有餐點喔！</p>
            <Link
              href="/"
              className="inline-block bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
            >
              去大廳看看 ➔
            </Link>
          </div>
        ) : (
          <>
            {/* 個人預算補貼提醒 */}
            {activeGroupOrder?.enable_budget_limit &&
              activeGroupOrder?.budget_limit_amount && (
                <BudgetLimitNotice
                  budgetLimit={activeGroupOrder.budget_limit_amount}
                  totalAmount={grandTotal}
                />
              )}

            {/* 1. 點餐明細 */}
            <CheckoutSummary
              cartItems={cartItems}
              grandTotal={grandTotal}
            />

            <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
              <label htmlFor="checkout-nickname-input" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>2. 你的訂購暱稱 <span className="text-sky-500">*</span></span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400">下次會自動記憶</span>
              </label>
              <input
                id="checkout-nickname-input"
                name="userNickname"
                type="text"
                placeholder="例如：小明 / 行銷部 賢義"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              {checkingDuplicate && nickname.trim() && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">正在檢查是否重複暱稱...</p>
              )}
              {!checkingDuplicate && hasDuplicateNickname && nickname.trim() && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2 text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                  ⚠️ 目前已有同名暱稱，建議加上姓氏或代號避免對帳混淆。
                </div>
              )}
            </div>

            {/* 3. 付款方式與 4. 缺貨備案 */}
            <CheckoutOptions
              paymentMethods={paymentMethods}
              selectedPayment={selectedPayment}
              onSelectPayment={setSelectedPayment}
              soldOutOptions={soldOutOptions}
              selectedSoldOut={selectedSoldOut}
              onSelectSoldOut={setSelectedSoldOut}
              onCopyAccount={handleCopyAccount}
            />

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitOrder}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 rounded-2xl text-base shadow-lg hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isSubmitting ? '正在送出訂單...' : `確認送出訂單 ($${grandTotal} 元)`}
            </button>
          </>
        )}
      </main>

      {/* 🎉 訂單送出成功精緻可愛動態轉場視窗 (自動平滑導航至訂單狀態頁) */}
      <OrderSuccessModal
        isOpen={successModalData.isOpen}
        orderNumber={successModalData.orderNumber}
        submissionId={successModalData.submissionId}
        storeName={successModalData.storeName}
        totalAmount={successModalData.totalAmount}
      />

      {/* ⚠️ 同暱稱防撞二次確認自訂彈窗 */}
      <DoubleConfirmModal
        isOpen={duplicateConfirmModal.isOpen}
        title={duplicateConfirmModal.title}
        message={duplicateConfirmModal.message}
        confirmText={duplicateConfirmModal.confirmText}
        cancelText={duplicateConfirmModal.cancelText}
        isDanger={false}
        onConfirm={duplicateConfirmModal.onConfirm}
        onCancel={() => setDuplicateConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">載入結帳頁面中...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}