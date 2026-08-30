'use client';

import { supabase } from '@/lib/supabase';
import { Store, MenuItem, Category } from '@/types/database';
import type { OrderHistoryRecord } from '@/app/my-orders/components/MyOrderHistoryCard';

export interface StoreCacheEntry {
  store: Store;
  menuItems: MenuItem[];
  customOrder?: string[] | null;
  timestamp: number;
}

export interface AppIndexCache {
  categories: Category[];
  stores: Store[];
  codeMap: Record<string, string>;
  timestamp: number;
}

// 🌟 1. 全域單例記憶體快取 (Normalized In-Memory Store & App Map)
const storeCacheMap = new Map<string, StoreCacheEntry>();
let globalAppIndexCache: AppIndexCache | null = null;
let globalOrderHistoryCache: OrderHistoryRecord[] | null = null;

// 🌟 2. 訂閱發布事件中心 (Pub/Sub Event Dispatcher)
const storeListeners = new Map<string, Set<(entry: StoreCacheEntry) => void>>();
const globalListeners = new Set<() => void>();
const appIndexListeners = new Set<(cache: AppIndexCache) => void>();
const orderHistoryListeners = new Set<(orders: OrderHistoryRecord[]) => void>();

// 🌟 3. 正在進行中的請求承諾 (In-Flight Request Deduplication)
const inFlightRequests = new Map<string, Promise<StoreCacheEntry | null>>();
let inFlightAppIndexRequest: Promise<AppIndexCache | null> | null = null;
let inFlightOrderHistoryRequest: Promise<OrderHistoryRecord[] | null> | null = null;

// ================= 全站歷史訂單 SWR 快取 (Order History Cache) =================
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

      if (!error && data) {
        const records = data as unknown as OrderHistoryRecord[];
        setOrderHistoryCache(records);
        return records;
      }
      return null;
    } catch (err) {
      console.error('[StoreMenuCache] Prefetch order history failed:', err);
      return null;
    } finally {
      inFlightOrderHistoryRequest = null;
    }
  })();

  return inFlightOrderHistoryRequest;
}

// ================= 全站分類與店家搜尋索引快取 (App Index Cache) =================
export function getAppIndexCache(): AppIndexCache | null {
  return globalAppIndexCache;
}

export function setAppIndexCache(cache: AppIndexCache): void {
  globalAppIndexCache = cache;
  appIndexListeners.forEach((cb) => {
    try {
      cb(cache);
    } catch (e) {
      console.error('AppIndex listener callback error:', e);
    }
  });
}

export function subscribeAppIndex(callback: (cache: AppIndexCache) => void): () => void {
  appIndexListeners.add(callback);
  return () => {
    appIndexListeners.delete(callback);
  };
}

export async function prefetchAppIndex(forceRefresh: boolean = false): Promise<AppIndexCache | null> {
  if (globalAppIndexCache && !forceRefresh && Date.now() - globalAppIndexCache.timestamp < 5 * 60 * 1000) {
    return globalAppIndexCache;
  }

  if (inFlightAppIndexRequest) {
    return inFlightAppIndexRequest;
  }

  inFlightAppIndexRequest = (async () => {
    try {
      const [catRes, storeRes, codeRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active')
          .eq('is_active', true),
        fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      ]);

      const categories = (catRes.data as Category[]) || [];
      const rawStores = (storeRes.data as Store[]) || [];
      const codeMap: Record<string, string> = codeRes?.codeMap || {};
      const formattedStores = rawStores.map((s) => ({
        ...s,
        code: codeMap[s.id] || 'S-001',
      }));

      const cacheObj: AppIndexCache = {
        categories,
        stores: formattedStores,
        codeMap,
        timestamp: Date.now(),
      };

      setAppIndexCache(cacheObj);
      return cacheObj;
    } catch (err) {
      console.error('[StoreMenuCache] Prefetch AppIndex failed:', err);
      return null;
    } finally {
      inFlightAppIndexRequest = null;
    }
  })();

  return inFlightAppIndexRequest;
}

// ================= 個別店家菜單快取 (Store Menu Cache) =================
export function getStoreCache(storeIdOrCode: string): StoreCacheEntry | null {
  if (!storeIdOrCode) return null;
  if (storeCacheMap.has(storeIdOrCode)) {
    return storeCacheMap.get(storeIdOrCode)!;
  }
  for (const entry of storeCacheMap.values()) {
    if (entry.store.id === storeIdOrCode || entry.store.code?.toUpperCase() === storeIdOrCode.toUpperCase()) {
      return entry;
    }
  }
  return null;
}

export function setStoreCache(storeId: string, entry: StoreCacheEntry): void {
  storeCacheMap.set(storeId, entry);
  if (entry.store.code) {
    storeCacheMap.set(entry.store.code.toUpperCase(), entry);
  }

  const subs = storeListeners.get(storeId);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(entry);
      } catch (e) {
        console.error('Store listener callback error:', e);
      }
    });
  }

  globalListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Global listener error:', e);
    }
  });
}

export function subscribeStoreCache(
  storeId: string,
  callback: (entry: StoreCacheEntry) => void
): () => void {
  if (!storeListeners.has(storeId)) {
    storeListeners.set(storeId, new Set());
  }
  storeListeners.get(storeId)!.add(callback);

  return () => {
    storeListeners.get(storeId)?.delete(callback);
  };
}

export function subscribeGlobalCache(callback: () => void): () => void {
  globalListeners.add(callback);
  return () => {
    globalListeners.delete(callback);
  };
}

export async function prefetchStoreData(
  storeIdOrCode: string,
  forceRefresh: boolean = false
): Promise<StoreCacheEntry | null> {
  if (!storeIdOrCode) return null;

  const cached = getStoreCache(storeIdOrCode);
  if (cached && !forceRefresh && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached;
  }

  const dedupeKey = storeIdOrCode.toUpperCase();
  if (inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeIdOrCode);

      let resolvedStore: Store | null = null;
      if (isUUID) {
        const { data: sData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeIdOrCode)
          .maybeSingle();
        resolvedStore = sData as Store | null;
      } else {
        const codeClean = storeIdOrCode.toUpperCase();
        const codeRes = await fetch(`/api/stores/code?storeId=${codeClean}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null);

        let targetId = codeRes?.storeId;
        if (!targetId && codeRes?.codeMap) {
          for (const [id, code] of Object.entries(codeRes.codeMap)) {
            if (String(code).toUpperCase() === codeClean) {
              targetId = id;
              break;
            }
          }
        }

        if (targetId) {
          const { data: sData } = await supabase
            .from('stores')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          resolvedStore = sData as Store | null;
        } else {
          const { data: sData } = await supabase
            .from('stores')
            .select('*')
            .eq('code', codeClean)
            .maybeSingle();
          resolvedStore = sData as Store | null;
        }
      }

      if (!resolvedStore) return null;

      const storeId = resolvedStore.id;

      const [menuRes, sortRes, codeRes] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('store_id', storeId)
          .order('name', { ascending: true }),
        fetch(`/api/menu/sort-order?storeId=${storeId}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null),
        fetch(`/api/stores/code?storeId=${storeId}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null),
      ]);

      const activeCode = codeRes?.code || resolvedStore.code || 'S-001';
      resolvedStore.code = activeCode;

      const rawItems = (menuRes.data as MenuItem[]) || [];
      const customOrder: string[] | null = sortRes?.orderedItemIds || null;

      let sortedItems = [...rawItems];
      if (customOrder && Array.isArray(customOrder) && customOrder.length > 0) {
        sortedItems = sortedItems.sort((a, b) => {
          const idxA = customOrder.indexOf(a.id);
          const idxB = customOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name, 'zh-TW');
        });
      }

      const entry: StoreCacheEntry = {
        store: resolvedStore,
        menuItems: sortedItems,
        customOrder,
        timestamp: Date.now(),
      };

      setStoreCache(storeId, entry);

      return entry;
    } catch (err) {
      console.error(`[StoreMenuCache] Prefetch failed for ${storeIdOrCode}:`, err);
      return null;
    } finally {
      inFlightRequests.delete(dedupeKey);
    }
  })();

  inFlightRequests.set(dedupeKey, fetchPromise);
  return fetchPromise;
}

export function patchStoreMenuItem(
  storeId: string,
  menuItemId: string,
  patch: Partial<MenuItem>
): void {
  const cached = getStoreCache(storeId);
  if (!cached) return;

  let hasChanged = false;
  const updatedItems = cached.menuItems.map((item) => {
    if (item.id === menuItemId) {
      hasChanged = true;
      return { ...item, ...patch };
    }
    return item;
  });

  if (hasChanged) {
    setStoreCache(storeId, {
      ...cached,
      menuItems: updatedItems,
      timestamp: Date.now(),
    });
  }
}

// 🌟 批次漸進式預載佇列（利用 requestIdleCallback 分批預抓）
class IdlePrefetchQueue {
  private queue: string[] = [];
  private isRunning: boolean = false;

  public enqueue(storeIds: string[]) {
    storeIds.forEach((id) => {
      if (!this.queue.includes(id) && !getStoreCache(id)) {
        this.queue.push(id);
      }
    });
    this.scheduleNext();
  }

  private scheduleNext() {
    if (this.isRunning || this.queue.length === 0) return;

    const runWork = () => {
      this.isRunning = true;
      const targetId = this.queue.shift();

      if (targetId) {
        prefetchStoreData(targetId)
          .catch(() => {})
          .finally(() => {
            this.isRunning = false;
            setTimeout(() => this.scheduleNext(), 120);
          });
      } else {
        this.isRunning = false;
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => runWork(), { timeout: 2000 });
    } else {
      setTimeout(runWork, 300);
    }
  }
}

export const idlePrefetchQueue = new IdlePrefetchQueue();

// 🌟 全域 Realtime 快取監聽器
let isRealtimeInitialized = false;

export function initGlobalRealtimeCache() {
  if (isRealtimeInitialized || typeof window === 'undefined') return () => {};
  isRealtimeInitialized = true;

  const channel = supabase
    .channel('global-menu-cache-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      (payload) => {
        const newRecord = payload.new as MenuItem | null;
        const oldRecord = payload.old as { id?: string; store_id?: string } | null;
        const storeId = newRecord?.store_id || oldRecord?.store_id;

        if (storeId) {
          const cached = getStoreCache(storeId);
          if (cached) {
            if (payload.eventType === 'UPDATE' && newRecord) {
              patchStoreMenuItem(storeId, newRecord.id, newRecord);
            } else {
              prefetchStoreData(storeId, true);
            }
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'stores' },
      (payload) => {
        const newStore = payload.new as Store | null;
        if (newStore?.id) {
          const cached = getStoreCache(newStore.id);
          if (cached) {
            setStoreCache(newStore.id, {
              ...cached,
              store: { ...cached.store, ...newStore },
              timestamp: Date.now(),
            });
          }
        }
        prefetchAppIndex(true);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'order_submissions' },
      (payload) => {
        const updated = payload.new as { id?: string; is_paid?: boolean; total_amount?: number; final_amount?: number };
        if (updated?.id && globalOrderHistoryCache) {
          const patched = globalOrderHistoryCache.map((o) =>
            o.id === updated.id ? { ...o, ...updated } : o
          );
          setOrderHistoryCache(patched);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    isRealtimeInitialized = false;
  };
}
