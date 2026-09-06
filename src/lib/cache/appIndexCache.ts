'use client';

import { supabase } from '@/lib/supabase';
import { Store, Category } from '@/types/database';

export interface AppIndexCache {
  categories: Category[];
  stores: Store[];
  codeMap: Record<string, string>;
  timestamp: number;
}

let globalAppIndexCache: AppIndexCache | null = null;
const appIndexListeners = new Set<(cache: AppIndexCache) => void>();
let inFlightAppIndexRequest: Promise<AppIndexCache | null> | null = null;

export function getAppIndexCache(): AppIndexCache | null {
  if (globalAppIndexCache) return globalAppIndexCache;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('menu_app_cached_index_snapshot');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.stores)) {
          globalAppIndexCache = parsed;
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setAppIndexCache(cache: AppIndexCache): void {
  globalAppIndexCache = cache;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('menu_app_cached_index_snapshot', JSON.stringify(cache));
    } catch {}
  }
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

export async function prefetchAppIndex(): Promise<AppIndexCache | null> {
  if (typeof window === 'undefined') return null;

  if (inFlightAppIndexRequest) {
    return inFlightAppIndexRequest;
  }

  inFlightAppIndexRequest = (async () => {
    try {
      const [catRes, storeRes, codeRes, groupRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active')
          .eq('is_active', true),
        fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
        supabase
          .from('group_orders')
          .select('id, store_id, title, status, enable_countdown, cutoff_time')
          .neq('status', 'completed')
          .order('created_at', { ascending: false }),
      ]);

      const catList = (catRes.data as Category[]) || [];
      const rawStores = (storeRes.data as Store[]) || [];
      const codeMap: Record<string, string> = codeRes?.codeMap || {};
      const activeGroups = (groupRes?.data || []) as Array<{
        id: string;
        store_id: string;
        title: string;
        status: string;
        enable_countdown?: boolean;
        cutoff_time?: string | null;
      }>;

      const formattedStores = rawStores.map((s) => {
        const activeGroup = activeGroups.find((g) => g.store_id === s.id && g.status !== 'completed');
        const enableCountdown = activeGroup?.enable_countdown ?? false;
        const cutoffTime = activeGroup?.cutoff_time || null;
        const isStoreAccepting = activeGroup ? activeGroup.status === 'open' : true;

        return {
          ...s,
          code: codeMap[s.id] || 'S-001',
          is_accepting_orders: isStoreAccepting,
          enable_countdown: enableCountdown,
          cutoff_time: cutoffTime,
          has_active_group: !!activeGroup,
          active_group_title: activeGroup?.title || null,
        };
      });

      const newCache: AppIndexCache = {
        categories: catList,
        stores: formattedStores,
        codeMap,
        timestamp: Date.now(),
      };

      setAppIndexCache(newCache);
      return newCache;
    } catch (e) {
      console.warn('AppIndex prefetch failed:', e);
    } finally {
      inFlightAppIndexRequest = null;
    }
    return null;
  })();

  return inFlightAppIndexRequest;
}
