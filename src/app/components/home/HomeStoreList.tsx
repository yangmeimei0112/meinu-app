'use client';

import React from 'react';
import Link from 'next/link';
import { Store } from '@/types/database';
import { Store as StoreIcon, ChevronRight } from 'lucide-react';
import { prefetchStoreData } from '@/lib/storeMenuCache';

function StoreCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-3.5 animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-full w-20" />
      </div>
      <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 shrink-0" />
    </div>
  );
}

interface HomeStoreListProps {
  stores: Store[];
  loading: boolean;
  checkIsStoreAccepting: (store: Store) => boolean;
}

export function HomeStoreList({
  stores,
  loading,
  checkIsStoreAccepting,
}: HomeStoreListProps) {
  if (loading) {
    return (
      <div className="space-y-3 pt-1">
        <StoreCardSkeleton />
        <StoreCardSkeleton />
        <StoreCardSkeleton />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800 shadow-xs">
        <StoreIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-80" />
        <p className="text-sm font-medium">找不到符合條件的店家</p>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">請嘗試其他搜尋關鍵字或分類</p>
      </div>
    );
  }

  return (
    <div data-theme-module="card" className="space-y-3 pt-1">
      {stores.map((store: Store) => {
        const isAccepting = checkIsStoreAccepting(store);

        return (
          <Link
            key={store.id}
            href={`/stores/${store.code || store.id}`}
            onMouseEnter={() => prefetchStoreData(store.id)}
            onTouchStart={() => prefetchStoreData(store.id)}
            className={`bg-white dark:bg-[#131B2B] rounded-3xl p-4 border flex items-center gap-3.5 hover:shadow-md transition-all duration-200 group active:scale-[0.99] relative overflow-hidden shadow-2xs ${
              isAccepting
                ? 'border-slate-200/80 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500/60'
                : 'border-slate-200/60 dark:border-slate-800/60 opacity-65 grayscale-35 hover:opacity-90 hover:grayscale-0'
            }`}
          >
            {/* 右上角標籤區 (店家代碼與暫停接單標註) */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {!isAccepting && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/80">
                  ⏸️ 暫停接單
                </span>
              )}
              <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-800/80 tracking-wide font-mono">
                #{store.code || 'S-001'}
              </span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-[#182234] flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-800/80">
              {store.image_url ? (
                <img
                  src={store.image_url}
                  alt={store.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <StoreIcon className="w-7 h-7 text-sky-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate group-hover:text-sky-500 transition-colors">
                {store.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">點擊瀏覽完整菜單與選購</p>
              <div className="mt-2 flex items-center gap-2">
                {isAccepting ? (
                  store.enable_countdown && store.cutoff_time ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60 animate-pulse">
                      ⏱️ 倒數收單中
                    </span>
                  ) : (
                    <span className="inline-block bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/60">
                      營業接單中
                    </span>
                  )
                ) : (
                  <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    暫停接單（可瀏覽菜單）
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        );
      })}
    </div>
  );
}
