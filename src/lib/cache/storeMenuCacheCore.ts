'use client';

import { supabase } from '@/lib/supabase';
import { Store, MenuItem } from '@/types/database';
import { prefetchAppIndex } from './appIndexCache';
import { prefetchOrderHistory } from './orderHistoryCache';

export interface StoreCacheEntry {
  store: Store;
  menuItems: MenuItem[];
  customOrder?: string[] | null;
  timestamp: number;
}

const storeCacheMap = new Map<string, StoreCacheEntry>();
const storeListeners = new Map<string, Set<(entry: StoreCacheEntry) => void>>();
const globalListeners = new Set<() => void>();
const inFlightRequests = new Map<string, Promise<StoreCacheEntry | null>>();

export function getStoreCache(storeId: string): StoreCacheEntry | null {
  if (!storeId) return null;
  const inMem = storeCacheMap.get(storeId);
  if (inMem) return inMem;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`menu_app_cached_store_${storeId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.store && Array.isArray(parsed.menuItems)) {
          storeCacheMap.set(storeId, parsed);
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setStoreCache(storeId: string, entry: StoreCacheEntry): void {
  if (!storeId || !entry) return;
  storeCacheMap.set(storeId, entry);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`menu_app_cached_store_${storeId}`, JSON.stringify(entry));
    } catch {}
  }

  const listeners = storeListeners.get(storeId);
  if (listeners) {
    listeners.forEach((cb) => {
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
      console.error('Global listener callback error:', e);
    }
  });
}

export function subscribeStoreData(
  storeId: string,
  callback: (entry: StoreCacheEntry) => void
): () => void {
  if (!storeListeners.has(storeId)) {
    storeListeners.set(storeId, new Set());
  }
  const set = storeListeners.get(storeId)!;
  set.add(callback);

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      storeListeners.delete(storeId);
    }
  };
}

export const subscribeStoreCache = subscribeStoreData;

export function patchStoreMenuItem(
  storeId: string,
  itemId: string,
  partial: Partial<MenuItem>
): void {
  const current = getStoreCache(storeId);
  if (!current) return;

  const updatedItems = current.menuItems.map((item) =>
    item.id === itemId ? { ...item, ...partial } : item
  );

  setStoreCache(storeId, {
    ...current,
    menuItems: updatedItems,
    timestamp: Date.now(),
  });
}

export async function prefetchStoreData(storeId: string): Promise<StoreCacheEntry | null> {
  if (!storeId || typeof window === 'undefined') return null;

  if (inFlightRequests.has(storeId)) {
    return inFlightRequests.get(storeId)!;
  }

  const promise = (async () => {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storeId);

      let resolvedStoreId = storeId;
      if (!isUUID) {
        const codeRes = await fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
        const map = codeRes?.reverseCodeMap || {};
        if (map[storeId.toUpperCase()]) {
          resolvedStoreId = map[storeId.toUpperCase()];
        }
      }

      const [storeRes, menuRes, sortRes] = await Promise.all([
        supabase
          .from('stores')
          .select('*, group_orders(*)')
          .eq('id', resolvedStoreId)
          .maybeSingle(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('store_id', resolvedStoreId)
          .eq('is_sold_out', false),
        fetch(`/api/menu/sort-order?storeId=${resolvedStoreId}`, { cache: 'no-store' })
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (storeRes.data) {
        const storeData = storeRes.data as Store;
        const menuData = (menuRes.data as MenuItem[]) || [];
        const customOrder = sortRes?.customOrder || null;

        const entry: StoreCacheEntry = {
          store: storeData,
          menuItems: menuData,
          customOrder,
          timestamp: Date.now(),
        };

        setStoreCache(storeId, entry);
        if (resolvedStoreId !== storeId) {
          setStoreCache(resolvedStoreId, entry);
        }

        return entry;
      }
    } catch (e) {
      console.warn('預抓店家失敗略過:', e);
    } finally {
      inFlightRequests.delete(storeId);
    }
    return null;
  })();

  inFlightRequests.set(storeId, promise);
  return promise;
}

// 閒置期漸進預抓佇列管理器
class IdlePrefetchQueue {
  private queue: string[] = [];
  private isProcessing = false;

  public enqueue(storeIds: string[]) {
    storeIds.forEach((id) => {
      if (!this.queue.includes(id)) {
        this.queue.push(id);
      }
    });
    this.scheduleNext();
  }

  private scheduleNext() {
    if (this.isProcessing || this.queue.length === 0 || typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        (deadline: any) => {
          if (deadline.timeRemaining() > 10 || deadline.didTimeout) {
            this.processItem();
          } else {
            this.scheduleNext();
          }
        },
        { timeout: 2000 }
      );
    } else {
      setTimeout(() => this.processItem(), 300);
    }
  }

  private async processItem() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const nextStoreId = this.queue.shift();

    if (nextStoreId) {
      const cached = getStoreCache(nextStoreId);
      if (!cached || Date.now() - cached.timestamp > 10 * 60 * 1000) {
        await prefetchStoreData(nextStoreId);
      }
    }

    this.isProcessing = false;
    this.scheduleNext();
  }
}

export const idlePrefetchQueue = new IdlePrefetchQueue();

let realtimeChannelInitialized = false;

export function initGlobalRealtimeCache(): () => void {
  if (typeof window === 'undefined' || realtimeChannelInitialized) return () => {};
  realtimeChannelInitialized = true;

  const channel = supabase
    .channel('global_cache_invalidations')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'stores' },
      () => {
        prefetchAppIndex();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      (payload: any) => {
        const storeId = payload.new?.store_id || payload.old?.store_id;
        if (storeId) {
          prefetchStoreData(storeId);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      () => {
        prefetchAppIndex();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'order_submissions' },
      () => {
        prefetchOrderHistory();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
    realtimeChannelInitialized = false;
  };
}
