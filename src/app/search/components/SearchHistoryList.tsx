'use client';

import React from 'react';
import { Clock, X } from 'lucide-react';

interface SearchHistoryListProps {
  searchHistory: string[];
  onSelectKeyword: (kw: string) => void;
  onRemoveItem: (e: React.MouseEvent, kw: string) => void;
  onClearAll: () => void;
}

export function SearchHistoryList({
  searchHistory,
  onSelectKeyword,
  onRemoveItem,
  onClearAll,
}: SearchHistoryListProps) {
  if (searchHistory.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
          搜尋紀錄
        </h3>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
        >
          全部清空
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#131B2B] rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xs">
        {searchHistory.map((item) => (
          <div
            key={item}
            onClick={() => onSelectKeyword(item)}
            className="flex items-center justify-between px-3.5 py-3 hover:bg-slate-50 dark:hover:bg-[#182338] transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-500 transition-colors truncate">
                {item}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => onRemoveItem(e, item)}
              aria-label={`刪除搜尋紀錄 ${item}`}
              className="text-slate-300 dark:text-slate-600 hover:text-rose-500 p-1 text-sm transition cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
