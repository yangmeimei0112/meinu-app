'use client';

import React from 'react';
import Link from 'next/link';
import type { Store } from '@/types/database';
import { Search, Store as StoreIcon, ChevronRight } from 'lucide-react';

interface SearchResultsListProps {
  searchQuery: string;
  searchResults: Store[];
  categoryMap: Record<string, string>;
  loading: boolean;
  onClearQuery: () => void;
  onSelectStore: (name: string) => void;
}

export function SearchResultsList({
  searchQuery,
  searchResults,
  categoryMap,
  loading,
  onClearQuery,
  onSelectStore,
}: SearchResultsListProps) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          搜尋「<span className="text-sky-500 dark:text-sky-400 font-extrabold">{searchQuery}</span>」的結果：
        </p>
        <span className="text-xs text-slate-400 font-bold">共 {searchResults.length} 家</span>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-8 text-center text-slate-400 text-xs animate-pulse border border-slate-100 dark:border-slate-800">
          正在即時檢索店家資料庫...
        </div>
      ) : searchResults.length === 0 ? (
        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">
              查無符合「{searchQuery}」的店家
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              請嘗試輸入其他關鍵字、或直接輸入店家代碼 (如 S-001)
            </p>
          </div>
          <button
            type="button"
            onClick={onClearQuery}
            className="inline-block bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-bold text-xs px-4 py-2 rounded-xl border border-sky-200 dark:border-sky-800 transition cursor-pointer"
          >
            清除搜尋條件
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {searchResults.map((store) => (
            <Link
              key={store.id}
              href={`/stores/${store.code || store.id}`}
              onClick={() => onSelectStore(store.name)}
              className="bg-white dark:bg-[#131B2B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-2xs hover:border-sky-200 dark:hover:border-sky-500/40 hover:shadow-xs transition active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                  {store.image_url ? (
                    <img
                      src={store.image_url}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <StoreIcon className="w-5 h-5 text-sky-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-sky-500 transition-colors">
                    {store.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {store.category_id && categoryMap[store.category_id] && (
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded">
                        {categoryMap[store.category_id]}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      代號：{store.code || 'S-001'}
                    </span>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-0.5 text-sky-500 text-xs font-black shrink-0 group-hover:translate-x-0.5 transition-transform">
                <span>進入點餐</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
