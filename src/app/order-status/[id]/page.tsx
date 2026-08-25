'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import OrderStatusActions from './components/OrderStatusActions';
import OrderStatusReceipt from './components/OrderStatusReceipt';

interface OrderItemDetail {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

interface OrderSubmissionDetail {
  id: string;
  group_order_id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  created_at: string;
}

interface GroupOrderMeta {
  id: string;
  store_id: string;
  status: 'open' | 'closed' | 'completed';
  stores?: {
    id: string;
    name: string;
  };
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;

  // ⚡ 優先自 SessionStorage 讀取背景預載入快取，達成 0ms 瞬開載入，徹底消除「正在載入」文字閃爍
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

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && submissionId) {
      try {
        const raw = sessionStorage.getItem(`meinu_order_cache_${submissionId}`);
        if (raw) return false;
      } catch {}
    }
    return true;
  });

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // 雙重確認視窗狀態
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    type: 'modify' | 'cancel';
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
  }>({
    isOpen: false,
    type: 'cancel',
    title: '',
    message: '',
    confirmText: '確定',
    isDanger: false,
  });

  const [isOrderOwner, setIsOrderOwner] = useState<boolean>(true);

  // 🛡️ 擁有者權限校驗 (防止 IDOR 越權篡改/取消他人訂單)
  useEffect(() => {
    if (typeof window !== 'undefined' && submissionId) {
      try {
        const historyRaw = localStorage.getItem('menu_app_order_history');
        const historyList: string[] = historyRaw ? JSON.parse(historyRaw) : [];
        const lastId = localStorage.getItem('menu_app_last_order_id');
        const isMine = historyList.includes(submissionId) || lastId === submissionId;
        setIsOrderOwner(isMine);
      } catch {
        setIsOrderOwner(false);
      }
    }
  }, [submissionId]);

  // 1. 抓取訂單詳細資料與明細 (SWR 平滑背景更新)
  useEffect(() => {
    async function fetchOrderDetails() {
      // 只有在無快取的情況下才展示骨架屏
      const hasCachedData = typeof window !== 'undefined' && sessionStorage.getItem(`meinu_order_cache_${submissionId}`);
      if (!hasCachedData && !order) {
        setLoading(true);
      }

      const { data: orderData } = await supabase
        .from('order_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('submission_id', submissionId);

      if (orderData) {
        setOrder(orderData as OrderSubmissionDetail);
        const createdAtTime = new Date(orderData.created_at).getTime();
        const elapsedSeconds = Math.floor((Date.now() - createdAtTime) / 1000);
        setTimeLeft(Math.max(0, 60 - elapsedSeconds));

        // 抓取團購活動與店家名稱
        if (orderData.group_order_id) {
          const { data: groupData } = await supabase
            .from('group_orders')
            .select('id, store_id, status, stores(id, name)')
            .eq('id', orderData.group_order_id)
            .single();

          if (groupData) {
            setGroupOrder(groupData as unknown as GroupOrderMeta);
          }
        }
      }

      if (itemsData) {
        setOrderItems(itemsData as OrderItemDetail[]);
      }

      setLoading(false);
    }

    fetchOrderDetails();
  }, [submissionId]);

  // ⚡ 2. 訂閱 Supabase Realtime！團長在後台一勾選，這裡秒變 ✅ 已收到款項
  useEffect(() => {
    const channel = supabase
      .channel(`order-status-${submissionId}`)
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
            setOrder((prev) => (prev ? { ...prev, ...payload.new } : null));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId]);

  // 3. 1分鐘倒數計時（支援彈窗開啟時暫停計時）
  useEffect(() => {
    if (timeLeft <= 0 || isTimerPaused) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isTimerPaused]);

  // 移除本地歷史紀錄輔助
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

  // 點擊「修改訂單」按鈕
  const handleOpenModifyModal = () => {
    setConfirmModalConfig({
      isOpen: true,
      type: 'modify',
      title: '✏️ 確認要修改這筆訂單嗎？',
      message:
        '系統會將您點的餐點完整還原回購物車，並取消此筆訂單，讓您可以直接重新調整規格、甜度冰塊或品項！',
      confirmText: '還原回購物車修改',
      isDanger: false,
    });
  };

  // 點擊「取消訂單」按鈕
  const handleOpenCancelModal = () => {
    setConfirmModalConfig({
      isOpen: true,
      type: 'cancel',
      title: '🗑️ 確認要取消這筆訂單嗎？',
      message: '取消後此筆單號將被註銷。若您之後仍想用餐，可以重新到菜單挑選送單。',
      confirmText: '確認取消訂單',
      isDanger: true,
    });
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 執行確認動作（修改或取消）
  const handleExecuteModalAction = async () => {
    if (!isOrderOwner) {
      showToast('🔒 權限限制：此訂單不屬於此裝置，無法執行修改或取消操作！');
      setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
    setIsActionLoading(true);

    try {
      if (confirmModalConfig.type === 'modify') {
        // 將餐點轉為購物車格式並寫入 LocalStorage
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

        // 刪除後台此筆訂單明細與訂單主檔
        await supabase.from('order_items').delete().eq('submission_id', submissionId);
        const { error: delSubErr } = await supabase.from('order_submissions').delete().eq('id', submissionId);
        if (delSubErr) throw delSubErr;

        cleanLocalHistory();

        showToast('🔄 已成功將品項還原回購物車！正在前往購物車...');
        setTimeout(() => router.push('/cart'), 500);
      } else {
        // 取消訂單：刪除後台此筆訂單明細與訂單主檔
        await supabase.from('order_items').delete().eq('submission_id', submissionId);
        const { error } = await supabase
          .from('order_submissions')
          .delete()
          .eq('id', submissionId);

        if (error) throw error;
        cleanLocalHistory();

        showToast('🗑️ 訂單已順利取消！正在返回首頁大廳...');
        setTimeout(() => router.push('/'), 500);
      }
    } catch (e) {
      console.error(e);
      showToast('❌ 操作失敗，可能訂單已被處理或網路不穩，請稍後重試');
    } finally {
      setIsActionLoading(false);
    }
  };

  const isClosed = groupOrder?.status === 'closed' || groupOrder?.status === 'completed';
  const isTimeUp = timeLeft === 0;
  const isActionDisabled = isTimeUp || isClosed || isActionLoading;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {/* 🌟 自訂高質感浮動通知視窗 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-bold px-5 py-3 rounded-full shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in zoom-in duration-200 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          ‹ 返回「咩nu」大廳
        </Link>

        {loading ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse border border-slate-100 dark:border-slate-800">
            正在載入訂單狀態與明細...
          </div>
        ) : !order ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 space-y-3 border border-slate-100 dark:border-slate-800">
            <div className="text-3xl">❓</div>
            <p className="font-extrabold text-slate-700 dark:text-slate-200">找不到該筆訂單資訊</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">訂單可能已被取消或連結單號不正確。</p>
            <Link
              href="/"
              className="inline-block bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
            >
              返回大廳 ➔
            </Link>
          </div>
        ) : (
          <>
            {/* 訂單成功與對帳標籤卡片 */}
            <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 text-2xl mx-auto flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-900/60 shadow-2xs">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                  訂單已成功送出！
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                  訂單編號：#{order.order_number}
                </p>
              </div>

              {/* ⚡ Realtime 對帳狀態動態更新標籤 */}
              <div className="pt-1">
                {order.is_paid ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-xs animate-in zoom-in duration-300">
                    <span>✅</span>
                    <span>團長已核實收到款項</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-extrabold px-4 py-1.5 rounded-full animate-pulse">
                    <span>⏳</span>
                    <span>待團長對帳與確認</span>
                  </span>
                )}
              </div>
            </div>

            {/* 1 分鐘限時自主修改/取消卡片（僅訂單擁有者裝置可見可操作） */}
            {isOrderOwner && (
              <OrderStatusActions
                timeLeft={timeLeft}
                isClosed={isClosed}
                isActionDisabled={isActionDisabled}
                onOpenModify={handleOpenModifyModal}
                onOpenCancel={handleOpenCancelModal}
              />
            )}

            {/* 明細卡片 */}
            <OrderStatusReceipt
              order={order}
              orderItems={orderItems}
            />
          </>
        )}
      </main>

      {/* 雙重確認視窗 (開啟期間暫停倒數計時) */}
      <DoubleConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        isDanger={confirmModalConfig.isDanger}
        onConfirm={handleExecuteModalAction}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onTimerPause={(pause) => setIsTimerPaused(pause)}
      />
    </div>
  );
}