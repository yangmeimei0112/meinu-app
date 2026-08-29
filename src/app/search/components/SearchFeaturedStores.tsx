'use client';

import React from 'react';
import Link from 'next/link';
import type { Store } from '@/types/database';
import { Sparkles, Store as StoreIcon } from 'lucide-react';
import { prefetchStoreData } from '@/lib/storeMenuCache';

interface SearchFeaturedStoresProps {
  stores: Store[];
  onSelectStore: (name: string) => void;
}

export function SearchFeaturedStores({
  stores,
  onSelectStore,
}: SearchFeaturedStoresProps) {
  if (stores.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span>本月矚目店家</span>
      </h3>

      <div className="grid grid-cols-3 gap-2.5">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/stores/${store.code || store.id}`}
            onMouseEnter={() => prefetchStoreData(store.id)}
            onTouchStart={() => prefetchStoreData(store.id)}
            onClick={() => onSelectStore(store.name)}
            className="bg-white dark:bg-[#131B2B] rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-2xs hover:border-sky-200 dark:hover:border-sky-500/40 hover:shadow-xs transition flex flex-col items-center text-center gap-2 group active:scale-95 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 overflow-hidden flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              {store.image_url ? (
                <img
                  src={store.image_url}
                  alt={store.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <StoreIcon className="w-6 h-6 text-sky-500" />
              )}
            </div>
            <div className="w-full">
              <p className="font-black text-xs text-slate-800 dark:text-slate-100 truncate">
                {store.name}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                {store.code || 'S-001'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
