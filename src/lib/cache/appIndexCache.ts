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

      const catList = (catRes.data as Category[]) || [];
      const rawStores = (storeRes.data as Store[]) || [];
      const codeMap: Record<string, string> = codeRes?.codeMap || {};

      const formattedStores = rawStores.map((s) => ({
        ...s,
        code: codeMap[s.id] || 'S-001',
      }));

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
