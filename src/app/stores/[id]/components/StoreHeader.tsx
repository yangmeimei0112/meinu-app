'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Share2, UtensilsCrossed } from 'lucide-react';
import type { Store } from '@/types/database';

interface StoreHeaderProps {
  store: Store | null;
  onShare: () => void;
}

export function StoreHeader({ store, onShare }: StoreHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回「咩nu」大廳</span>
        </Link>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {store?.name ? `店家：${store.name}` : ''}
        </span>
      </div>

      {store && (
        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-3xl shrink-0 border border-sky-100 dark:border-sky-900/60 overflow-hidden">
              {store.image_url ? (
                <img
                  src={store.image_url}
                  alt={store.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate">
                {store.name}
              </h2>
              <span className="inline-flex items-center gap-1 mt-1 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>營業中 &bull; 支援團購</span>
                {store.code && (
                  <span className="ml-1 px-1.5 py-0.2 bg-sky-500 text-white rounded font-mono text-[9px]">
                    {store.code}
                  </span>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1C2638] dark:hover:bg-[#253248] text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
            title="分享店家點餐連結"
          >
            <Share2 className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">分享</span>
          </button>
        </div>
      )}
    </div>
  );
}
