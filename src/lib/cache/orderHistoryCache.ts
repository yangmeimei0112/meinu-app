'use client';

import { supabase } from '@/lib/supabase';
import type { OrderHistoryRecord } from '@/app/my-orders/components/MyOrderHistoryCard';
import { parseOrderProgressStatus, serializeOrderProgressStatus } from '@/types/orderStatus';

let globalOrderHistoryCache: OrderHistoryRecord[] | null = null;
const orderHistoryListeners = new Set<(orders: OrderHistoryRecord[]) => void>();
let inFlightOrderHistoryRequest: Promise<OrderHistoryRecord[] | null> | null = null;

const STORAGE_KEY_CACHED_DETAIL = 'menu_app_cached_orders_detail';
const STORAGE_KEY_ORDER_HISTORY = 'menu_app_order_history';
const STORAGE_KEY_LAST_ORDER_ID = 'menu_app_last_order_id';
const STORAGE_KEY_PURGED_IDS = 'menu_app_purged_order_ids';

/**
 * 取得本機已被「徹底抹除」的訂單 ID 清單
 */
export function getPurgedOrderIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PURGED_IDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

/**
 * 記錄徹底抹除的訂單 ID，確保永不再於前台出現
 */
export function recordPurgedOrderId(orderId: string | string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getPurgedOrderIds();
    const ids = Array.isArray(orderId) ? orderId : [orderId];
    ids.forEach((id) => set.add(id));
    localStorage.setItem(STORAGE_KEY_PURGED_IDS, JSON.stringify(Array.from(set).slice(-100)));

    // 同步自當前本機快取剔除
    const current = getOrderHistoryCache() || [];
    const filtered = current.filter((o) => !ids.includes(o.id));
    setOrderHistoryCache(filtered);

    // 同步自歷史 ID 清單剔除
    const histRaw = localStorage.getItem(STORAGE_KEY_ORDER_HISTORY);
    if (histRaw) {
      const arr = JSON.parse(histRaw);
      if (Array.isArray(arr)) {
        const nextArr = arr.filter((id: string) => !ids.includes(id));
        localStorage.setItem(STORAGE_KEY_ORDER_HISTORY, JSON.stringify(nextArr));
      }
    }
  } catch {}
}

/**
 * 取得當前本機歷史訂單快照
 */
export function getOrderHistoryCache(forceReload: boolean = false): OrderHistoryRecord[] | null {
  if (!forceReload && globalOrderHistoryCache !== null) return globalOrderHistoryCache;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CACHED_DETAIL);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const purgedSet = getPurgedOrderIds();
          const validList = parsed.filter((o) => o && o.id && !purgedSet.has(o.id));
          globalOrderHistoryCache = validList;
          return validList;
        }
      }
    } catch {
      globalOrderHistoryCache = null;
      return null;
    }
  }
  globalOrderHistoryCache = null;
  return null;
}

/**
 * 更新歷史訂單快取並廣播給所有訂閱元件
 */
export function setOrderHistoryCache(orders: OrderHistoryRecord[]): void {
  const purgedSet = getPurgedOrderIds();
  const validOrders = orders.filter((o) => o && o.id && !purgedSet.has(o.id));
  globalOrderHistoryCache = validOrders;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CACHED_DETAIL, JSON.stringify(validOrders.slice(0, 50)));
      // 同步維護 order_history ID 清單
      const ids = validOrders.map((o) => o.id);
      localStorage.setItem(STORAGE_KEY_ORDER_HISTORY, JSON.stringify(ids));
    } catch {}
  }

  orderHistoryListeners.forEach((cb) => {
    try {
      cb(validOrders);
    } catch (e) {
      console.error('Order history listener callback error:', e);
    }
  });
}

/**
 * 🗑️ 前台清空所有歷史訂單
 */
export function clearAllOrderHistory(): void {
  globalOrderHistoryCache = [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_CACHED_DETAIL);
      localStorage.removeItem(STORAGE_KEY_ORDER_HISTORY);
      localStorage.removeItem(STORAGE_KEY_LAST_ORDER_ID);
      window.dispatchEvent(new Event('menu_app_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
  orderHistoryListeners.forEach((cb) => {
    try {
      cb([]);
    } catch (e) {
      console.error('Order history clear callback error:', e);
    }
  });
}

/**
 * 訂閱歷史訂單變更
 */
export function subscribeOrderHistory(callback: (orders: OrderHistoryRecord[]) => void): () => void {
  orderHistoryListeners.add(callback);
  return () => {
    orderHistoryListeners.delete(callback);
  };
}

/**
 * ⚡ 智慧非破壞性背景預取與資料庫同步 (Non-destructive SWR Reconciliation)
 * 若後台資料庫刪除訂單，前台仍妥善保留本機歷史快照，並依規則進行狀態自動對齊
 */
export async function prefetchOrderHistory(): Promise<OrderHistoryRecord[] | null> {
  if (typeof window === 'undefined') return null;

  if (inFlightOrderHistoryRequest) {
    return inFlightOrderHistoryRequest;
  }

  inFlightOrderHistoryRequest = (async () => {
    try {
      const purgedSet = getPurgedOrderIds();
      let orderIds: string[] = [];
      const historyRaw = localStorage.getItem(STORAGE_KEY_ORDER_HISTORY);
      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed)) orderIds = parsed.filter((id) => !purgedSet.has(id));
        } catch {}
      }
      const lastId = localStorage.getItem(STORAGE_KEY_LAST_ORDER_ID);
      if (lastId && !purgedSet.has(lastId) && !orderIds.includes(lastId)) {
        orderIds.unshift(lastId);
      }

      const cachedOrders = getOrderHistoryCache() || [];

      if (orderIds.length === 0 && cachedOrders.length === 0) {
        setOrderHistoryCache([]);
        return [];
      }

      // 合併快取中的 ID
      cachedOrders.forEach((o) => {
        if (o?.id && !purgedSet.has(o.id) && !orderIds.includes(o.id)) {
          orderIds.push(o.id);
        }
      });

      // 查詢資料庫中仍存在的訂單
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
          signature_data,
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
              name,
              image_url
            )
          )
        `)
        .in('id', orderIds.slice(0, 50))
        .order('created_at', { ascending: false });

      if (!error && data) {
        const dbRecords = data as unknown as OrderHistoryRecord[];
        const dbMap = new Map(dbRecords.map((r) => [r.id, r]));

        // 🌟 非破壞性合併：如果快取中有某些訂單未在資料庫返回（代表後台已刪除/歸檔）
        const mergedList: OrderHistoryRecord[] = [];

        // 優先放入資料庫最新記錄
        dbRecords.forEach((r) => {
          if (!purgedSet.has(r.id)) {
            // 檢查是否包含徹底抹除標記
            const isPurged =
              typeof r.signature_url === 'string' &&
              (r.signature_url.includes('"status":"purged"') ||
                r.signature_url.includes('"tombstone":"purge_everywhere"') ||
                r.signature_url.includes('"purged":true'));

            if (isPurged) {
              recordPurgedOrderId(r.id);
            } else {
              mergedList.push(r);
            }
          }
        });

        // 處理已被後台刪除但前台需保留的歷史訂單
        cachedOrders.forEach((cached) => {
          if (!cached || !cached.id || purgedSet.has(cached.id)) return;

          if (!dbMap.has(cached.id)) {
            // 該訂單已從後台資料庫移除
            const isCachedPurged =
              typeof cached.signature_url === 'string' &&
              (cached.signature_url.includes('"status":"purged"') ||
                cached.signature_url.includes('"tombstone":"purge_everywhere"') ||
                cached.signature_url.includes('"purged":true'));

            const currentStatus = parseOrderProgressStatus(cached.signature_url);

            // ⚠️ 關鍵防護：若該訂單已被徹底抹除 (purge_everywhere)，或處於非已完成狀態自資料庫移除，
            // 絕不可將其復活為「已取消 (cancelled)」！直接記錄至 purgedSet 徹底同步抹除！
            if (isCachedPurged || currentStatus !== 'completed') {
              recordPurgedOrderId(cached.id);
              return;
            }

            // 僅歷史已完成訂單（如活動結案被移入封存歷史庫）保留已完成收據憑證供查閱
            const retainedRecord: OrderHistoryRecord = {
              ...cached,
              signature_url: serializeOrderProgressStatus('completed', '後台已結單完成'),
            };

            mergedList.push(retainedRecord);
          }
        });

        // 依據建立時間降冪排序
        mergedList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setOrderHistoryCache(mergedList);
        return mergedList;
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
