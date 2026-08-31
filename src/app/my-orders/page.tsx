'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { CartItem, MultiStoreCart } from '@/types/cart';
import { ClipboardList, ChevronLeft } from 'lucide-react';
import { useToast } from '@/lib/useToast';
import { MyOrderHistoryCard, OrderHistoryRecord } from './components/MyOrderHistoryCard';
import { MyOrdersEmptyState } from './components/MyOrdersEmptyState';
import {
  getOrderHistoryCache,
  setOrderHistoryCache,
  subscribeOrderHistory,
  prefetchOrderHistory,
} from '@/lib/storeMenuCache';

export default function MyOrdersPage() {
  const router = useRouter();

  // 🌟 1. 優先自記憶體/本地快照同步初始化（0ms 秒開，免等資料庫檢索）
  const initialOrders = getOrderHistoryCache();
  const [orders, setOrders] = useState<OrderHistoryRecord[]>(initialOrders || []);
  const [loading, setLoading] = useState<boolean>(!initialOrders);

  // 使用共用 useToast Hook
  const { toastMessage, showToast } = useToast();

  useEffect(() => {
    // 進入「我的訂單」頁面時，標記新訂單已查看，解除 Header 上的紅點閃爍
    try {
      localStorage.setItem('menu_app_has_new_order', 'false');
      window.dispatchEvent(new Event('menu_app_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    // 🌟 2. 訂閱歷史訂單變更
    const unsub = subscribeOrderHistory((cached) => {
      setOrders(cached);
      setLoading(false);
    });

    // 🌟 3. 背景執行 SWR 靜默校驗
    const hasCache = !!getOrderHistoryCache();
    if (!hasCache) {
      setLoading(true);
    }

    prefetchOrderHistory()
      .then((records) => {
        if (records) setOrders(records);
      })
      .catch((err) => console.error('Prefetch order history error in page:', err))
      .finally(() => setLoading(false));

    // ⚡ 訂閱 Realtime 更新付款狀態
    const channel = supabase
      .channel('my-orders-realtime-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_submissions' },
        (payload) => {
          if (payload.new) {
            setOrders((prev) => {
              const updated = prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o));
              setOrderHistoryCache(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      unsub();
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
    showToast(`已將「${storeName}」的餐點重新加入購物車！`);

    setTimeout(() => {
      router.push('/cart');
    }, 400);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
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
            <ChevronLeft className="w-4 h-4" />
            <span>返回「咩nu」大廳</span>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-500" />
            <span>我的歷史訂單</span>
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
          <MyOrdersEmptyState />
        ) : (
          <div className="space-y-3.5">
            {orders.map((order) => (
              <MyOrderHistoryCard
                key={order.id}
                order={order}
                onReorder={handleReorder}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
