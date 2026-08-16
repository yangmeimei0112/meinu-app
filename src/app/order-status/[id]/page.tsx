'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';

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

  const [order, setOrder] = useState<OrderSubmissionDetail | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemDetail[]>([]);
  const [groupOrder, setGroupOrder] = useState<GroupOrderMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  // 1. 抓取訂單詳細資料與明細
  useEffect(() => {
    async function fetchOrderDetails() {
      setLoading(true);

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

  // 執行確認動作（修改或取消）
  const handleExecuteModalAction = async () => {
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

        // 刪除後台此筆訂單
        await supabase.from('order_submissions').delete().eq('id', submissionId);
        cleanLocalHistory();

        alert('🔄 已成功將品項還原回購物車！請在購物車進行修改。');
        router.push('/cart');
      } else {
        // 取消訂單
        const { error } = await supabase
          .from('order_submissions')
          .delete()
          .eq('id', submissionId);

        if (error) throw error;
        cleanLocalHistory();

        alert('🗑️ 訂單已順利取消！');
        router.push('/');
      }
    } catch (e) {
      console.error(e);
      alert('❌ 操作失敗，可能訂單已被處理或網路不穩，請稍後重試');
    } finally {
      setIsActionLoading(false);
    }
  };

  const isClosed = groupOrder?.status === 'closed' || groupOrder?.status === 'completed';
  const isTimeUp = timeLeft === 0;
  const isActionDisabled = isTimeUp || isClosed || isActionLoading;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <OfflineBanner />
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-500 transition py-1"
        >
          ‹ 返回「咩nu」大廳
        </Link>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-sm animate-pulse">
            正在載入訂單狀態與明細...
          </div>
        ) : !order ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500 space-y-3">
            <div className="text-3xl">❓</div>
            <p className="font-extrabold text-slate-700">找不到該筆訂單資訊</p>
            <p className="text-xs text-slate-400">訂單可能已被取消或連結單號不正確。</p>
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
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 text-2xl mx-auto flex items-center justify-center font-bold border border-emerald-100 shadow-2xs">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  訂單已成功送出！
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  訂單編號：#{order.order_number}
                </p>
              </div>

              {/* ⚡ Realtime 對帳狀態動態更新標籤 */}
              <div className="pt-1">
                {order.is_paid ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-xs animate-in zoom-in duration-300">
                    <span>✅</span>
                    <span>團長已核實收到款項</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold px-4 py-1.5 rounded-full animate-pulse">
                    <span>⏳</span>
                    <span>待團長對帳與確認</span>
                  </span>
                )}
              </div>
            </div>

            {/* 1 分鐘限時自主修改/取消卡片 */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-3.5 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-200">
                      1分鐘限時自主改單/取消
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isClosed
                        ? '團長已截單，停止改單'
                        : isTimeUp
                        ? '已逾 60 秒，如需修改請聯繫團長'
                        : '送單後 60 秒內可自行修改或取消'}
                    </p>
                  </div>
                </div>

                <span
                  className={`font-mono text-sm font-extrabold px-3 py-1 rounded-xl border transition-colors ${
                    isTimeUp || isClosed
                      ? 'bg-slate-800 text-slate-500 border-slate-700'
                      : 'bg-sky-950 text-sky-400 border-sky-800'
                  }`}
                >
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
              </div>

              {/* 操作按鈕群：修改訂單 & 取消訂單 */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={handleOpenModifyModal}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                    isActionDisabled
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                  }`}
                >
                  <span>✏️ 修改訂單</span>
                </button>

                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={handleOpenCancelModal}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                    isActionDisabled
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                  }`}
                >
                  <span>🗑️ 取消訂單</span>
                </button>
              </div>
            </div>

            {/* 明細卡片 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                點餐內容與明細
              </h3>

              <div className="divide-y divide-slate-100">
                {orderItems.map((item) => (
                  <div key={item.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                      <span>
                        {item.item_name} x {item.quantity}
                      </span>
                      <span>${item.unit_price * item.quantity} 元</span>
                    </div>
                    {item.custom_notes && (
                      <p className="text-xs text-slate-400">
                        {item.custom_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>訂購人暱稱：</span>
                  <span className="font-bold text-slate-800">
                    {order.user_nickname}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>付款方式：</span>
                  <span className="font-bold text-slate-800">
                    {order.payment_method_name}
                  </span>
                </div>
                {order.sold_out_option && (
                  <div className="flex justify-between">
                    <span>缺貨備案：</span>
                    <span className="font-bold text-slate-800">
                      {order.sold_out_option}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-sky-600 pt-2 border-t border-slate-100">
                  <span>應付總金額：</span>
                  <span className="text-base">${order.final_amount} 元</span>
                </div>
              </div>
            </div>
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