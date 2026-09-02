'use client';

import { supabase } from '@/lib/supabase';
import type { OrderHistoryRecord } from '@/app/my-orders/components/MyOrderHistoryCard';

let globalOrderHistoryCache: OrderHistoryRecord[] | null = null;
const orderHistoryListeners = new Set<(orders: OrderHistoryRecord[]) => void>();
let inFlightOrderHistoryRequest: Promise<OrderHistoryRecord[] | null> | null = null;

export function getOrderHistoryCache(): OrderHistoryRecord[] | null {
  if (globalOrderHistoryCache) return globalOrderHistoryCache;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('menu_app_cached_orders_detail');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          globalOrderHistoryCache = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setOrderHistoryCache(orders: OrderHistoryRecord[]): void {
  globalOrderHistoryCache = orders;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('menu_app_cached_orders_detail', JSON.stringify(orders.slice(0, 30)));
    } catch {}
  }
  orderHistoryListeners.forEach((cb) => {
    try {
      cb(orders);
    } catch (e) {
      console.error('Order history listener callback error:', e);
    }
  });
}

export function subscribeOrderHistory(callback: (orders: OrderHistoryRecord[]) => void): () => void {
  orderHistoryListeners.add(callback);
  return () => {
    orderHistoryListeners.delete(callback);
  };
}

export async function prefetchOrderHistory(): Promise<OrderHistoryRecord[] | null> {
  if (typeof window === 'undefined') return null;

  if (inFlightOrderHistoryRequest) {
    return inFlightOrderHistoryRequest;
  }

  inFlightOrderHistoryRequest = (async () => {
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
        setOrderHistoryCache([]);
        return [];
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
          signature_url,
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
            status,
            stores (
              id,
              name
            )
          )
        `)
        .in('id', orderIds.slice(0, 30))
        .order('created_at', { ascending: false });

      if (!error && data) {
        const records = data as unknown as OrderHistoryRecord[];
        setOrderHistoryCache(records);
        return records;
      }
    } catch (e) {
      console.warn('歷史訂單背景預取略過:', e);
    } finally {
      inFlightOrderHistoryRequest = null;
    }
    return null;
  })();

  return inFlightOrderHistoryRequest;
}
