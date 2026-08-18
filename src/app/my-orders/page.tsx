'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';

interface OrderItemRow {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

interface OrderHistoryRecord {
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
  order_items: OrderItemRow[];
  group_orders?: {
    id: string;
    store_id: string;
    stores?: {
      id: string;
      name: string;
      image_url: string | null;
    };
  };
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    // 進入「我的訂單」頁面時，標記新訂單已查看，解除 Header 上的紅點閃爍
    try {
      localStorage.setItem('menu_app_has_new_order', 'false');
      window.dispatchEvent(new Event('menu_app_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    async function fetchOrders() {
      setLoading(true);

      try {
        let orderIds: string[] = [];

        const historyRaw = localStorage.getItem('menu_app_order_history');
        if (historyRaw) {
          try {
            const parsed = JSON.parse(historyRaw);
            if (Array.isArray(parsed)) orderIds = parsed;
          } catch {}
        }

        const lastId = localStorage.getItem('menu_app_last_order_id');
        if (lastId && !orderIds.includes(lastId)) {
          orderIds.unshift(lastId);
        }

        if (orderIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('order_submissions')
          .select(`
            id,
            group_order_id,
            order_number,
            user_nickname,
            payment_method_name,
            sold_out_option,
            total_amount,
            final_amount,
            is_paid,
            created_at,
            order_items (
              id,
              item_name,
              quantity,
              unit_price,
              custom_notes
            ),
            group_orders (
              id,
              store_id,
              stores (
                id,
                name,
                image_url
              )
            )
          `)
          .in('id', orderIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setOrders(data as unknown as OrderHistoryRecord[]);
        }
      } catch (err) {
        console.error('Fetch history orders error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();

    // ⚡ 訂閱 Realtime 更新付款狀態
    const channel = supabase
      .channel('my-orders-realtime-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_submissions' },
        (payload) => {
          if (payload.new) {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔄 「一鍵再點一次」：將該筆訂單的所有餐點與客製化直接帶入購物車
  const handleReorder = (order: OrderHistoryRecord) => {
    const storeId = order.group_orders?.store_id || 'store';
    const storeName = order.group_orders?.stores?.name || '店家';

    const newCartItems: CartItem[] = order.order_items.map((item, index) => ({
      cartItemId: `reorder-${item.id}-${Date.now()}-${index}`,
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
    const multiCart: MultiStoreCart = savedMulti ? JSON.parse(savedMulti) : {};

    const existingStoreCart = multiCart[storeId]?.items || [];
    multiCart[storeId] = {
      storeId,
      storeName,
      items: [...existingStoreCart, ...newCartItems],
    };

    localStorage.setItem('menu_app_multi_cart', JSON.stringify(multiCart));
    showToast(`🎉 已將「${storeName}」的餐點重新加入購物車！`);

    setTimeout(() => {
      router.push('/cart');
    }, 400);
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
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
          >
            ‹ 返回「咩nu」大廳
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>📋 我的歷史訂單</span>
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
            共 {orders.length} 筆送訂紀錄
          </span>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse border border-slate-100 dark:border-slate-800">
            正在載入您的歷史訂單紀錄...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="text-4xl">🧾</div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">您目前在此裝置上尚無點餐紀錄喔！</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">送出訂單後，可隨時在此追蹤付款狀態與一鍵再點一次。</p>
            <Link
              href="/"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-xs transition active:scale-95"
            >
              前往點餐大廳 ➔
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orders.map((order) => {
              const storeName = order.group_orders?.stores?.name || '團購店家';
              const formattedDate = new Date(order.created_at).toLocaleString('zh-TW', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5"
                >
                  {/* 頂部店家與狀態 */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span>🥤 {storeName}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                        單號 #{order.order_number} • {formattedDate}
                      </p>
                    </div>

                    <div>
                      {order.is_paid ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs">
                          <span>✅</span>
                          <span>已付款</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-extrabold px-3 py-1 rounded-full animate-pulse">
                          <span>⏳</span>
                          <span>待對帳</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 餐點明細 */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="py-2 space-y-0.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                          <span>
                            {item.item_name} x {item.quantity}
                          </span>
                          <span>${item.unit_price * item.quantity} 元</span>
                        </div>
                        {item.custom_notes && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-400">{item.custom_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 總結與付款方式 */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      付款方式：<span className="font-bold text-slate-700 dark:text-slate-200">{order.payment_method_name}</span>
                    </span>
                    <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm">
                      合計 ${order.final_amount} 元
                    </span>
                  </div>

                  {/* 底部操作按鈕：一鍵再點一次 & 查看狀態 */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold text-xs py-2.5 rounded-2xl border border-sky-100 dark:border-slate-700 transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>🔄 一鍵再點一次</span>
                    </button>

                    <Link
                      href={`/order-status/${order.id}`}
                      className="bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-2xl text-center shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>查看詳細 ➔</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
