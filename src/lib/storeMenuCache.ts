'use client';

import { supabase } from '@/lib/supabase';
import { Store, MenuItem } from '@/types/database';

export interface StoreCacheEntry {
  store: Store;
  menuItems: MenuItem[];
  customOrder?: string[] | null;
  timestamp: number;
}

// 🌟 1. 全域單例記憶體快取 (Normalized In-Memory Store Map)
const storeCacheMap = new Map<string, StoreCacheEntry>();

// 🌟 2. 訂閱發布事件中心 (Pub/Sub Event Dispatcher)
const storeListeners = new Map<string, Set<(entry: StoreCacheEntry) => void>>();
const globalListeners = new Set<() => void>();

// 🌟 3. 正在進行中的請求承諾 (In-Flight Request Deduplication)
const inFlightRequests = new Map<string, Promise<StoreCacheEntry | null>>();

// 讀取快取
export function getStoreCache(storeIdOrCode: string): StoreCacheEntry | null {
  if (!storeIdOrCode) return null;
  // 同步比對 ID 或 S-??? 編號
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

// 寫入快取並廣播
export function setStoreCache(storeId: string, entry: StoreCacheEntry): void {
  storeCacheMap.set(storeId, entry);
  if (entry.store.code) {
    storeCacheMap.set(entry.store.code.toUpperCase(), entry);
  }

  // 廣播給該店家的監聽組件
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

// 訂閱特定店家的快取變更
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

// 訂閱全域快取更新
export function subscribeGlobalCache(callback: () => void): () => void {
  globalListeners.add(callback);
  return () => {
    globalListeners.delete(callback);
  };
}

// 🌟 4. SWR 核心：靜默預載/拉取店家與菜單資料 (帶去重與容災)
export async function prefetchStoreData(
  storeIdOrCode: string,
  forceRefresh: boolean = false
): Promise<StoreCacheEntry | null> {
  if (!storeIdOrCode) return null;

  // 1. 若已有快取且未強制更新，直接命中返回
  const cached = getStoreCache(storeIdOrCode);
  if (cached && !forceRefresh && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached;
  }

  // 2. 若已有相同的在途請求，複用 Promise 杜絕並發重複查詢 (Request Deduplication)
  const dedupeKey = storeIdOrCode.toUpperCase();
  if (inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey)!;
  }

  const fetchPromise = (async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeIdOrCode);

      // 步驟 A: 解析店家主檔
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

      // 步驟 B: 並行抓取菜單品項、編號與排序設定
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

      // 寫入快取並通知所有訂閱者
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

// 🌟 5. Realtime 局部補丁更新器 (In-Place Selective Patching)
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

// 🌟 6. 批次漸進式預載佇列（利用 requestIdleCallback 分批預抓）
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
            // 稍作微小間隔 120ms，繼續排定下一個
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

// 🌟 7. 全域 Realtime 快取監聽器（單例維持連線）
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
              // INSERT 或 DELETE 時進行背景靜默重新拉取
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
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    isRealtimeInitialized = false;
  };
}
