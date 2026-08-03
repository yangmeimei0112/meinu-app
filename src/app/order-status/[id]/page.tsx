'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';

interface OrderItemDetail {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

interface OrderSubmissionDetail {
  id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  created_at: string;
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
  const [loading, setLoading] = useState<boolean>(true);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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

  // 3. 1分鐘倒數
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleCancelOrder = async () => {
    if (!confirm('⚠️ 確定要取消這筆訂單嗎？取消後可重新挑選餐點。')) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('order_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      alert('🗑️ 訂單已順利取消！');
      localStorage.removeItem('menu_app_last_order_id');
      router.push('/');
    } catch (e) {
      console.error(e);
      alert('❌ 取消訂單失敗，請稍後重試');
    } finally {
      setIsDeleting(false);
    }
  };

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
            載入訂單狀態中...
          </div>
        ) : !order ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500 space-y-2">
            <p className="font-bold">找不到該筆訂單資訊</p>
            <p className="text-xs text-slate-400">訂單可能已被取消或不符合單號。</p>
          </div>
        ) : (
          <>
            {/* 訂單成功與對帳標籤卡片 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 text-2xl mx-auto flex items-center justify-center font-bold border border-sky-100">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  訂單已成功送出！
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  訂單編號：#{order.order_number}
                </p>
              </div>

              {/* ⚡ Realtime 對帳狀態動態更新標籤 */}
              <div className="pt-2">
                {order.is_paid ? (
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs animate-in zoom-in duration-300">
                    ✅ 團長已核實收到款項
                  </span>
                ) : (
                  <span className="inline-block bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-3.5 py-1.5 rounded-full animate-pulse">
                    ⏳ 待團長對帳與確認
                  </span>
                )}
              </div>
            </div>

            {/* 1 分鐘限時改單/取消卡片 */}
            <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <h3 className="text-xs font-bold text-slate-200">
                    1分鐘限時改單/取消
                  </h3>
                </div>
                <span className="text-sm font-mono font-extrabold text-sky-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                {timeLeft > 0
                  ? '倒數時間內點擊「取消訂單」可退回重新挑選品項。'
                  : '已超過 60 秒可改單時間，如需修改請直接聯繫團長。'}
              </p>

              <button
                type="button"
                disabled={timeLeft === 0 || isDeleting}
                onClick={handleCancelOrder}
                className="w-full bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 font-bold py-2.5 rounded-2xl text-xs transition disabled:opacity-30 disabled:pointer-events-none"
              >
                {isDeleting ? '正在取消...' : '🗑️ 取消此訂單 (重新點餐)'}
              </button>
            </div>

            {/* 明細卡片 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
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

              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
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
                  <span>${order.final_amount} 元</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}