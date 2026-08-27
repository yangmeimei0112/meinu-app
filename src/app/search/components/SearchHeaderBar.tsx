'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, X } from 'lucide-react';

interface SearchHeaderBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function SearchHeaderBar({
  searchQuery,
  onSearchChange,
  onSubmit,
  inputRef,
}: SearchHeaderBarProps) {
  return (
    <div className="space-y-3">
      {/* 頂部返回導覽 */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回「咩nu」大廳</span>
        </Link>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          全站智慧搜尋
        </span>
      </div>

      {/* 🔍 頂部膠囊型常駐搜尋列 */}
      <form onSubmit={onSubmit} className="relative group">
        <label htmlFor="search-page-input" className="sr-only">
          搜尋餐廳和生鮮雜貨店家
        </label>
        <input
          ref={inputRef}
          id="search-page-input"
          type="text"
          aria-label="搜尋餐廳、餐點或店家代號"
          placeholder="搜尋餐廳、餐點或店家代號 (S-001)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-500 transition-all shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {/* 放大鏡圖示 */}
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-sky-500" />
        {/* 一鍵清空按鈕 */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              if (inputRef.current) inputRef.current.focus();
            }}
            aria-label="清除搜尋內容"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </form>
    </div>
  );
}
