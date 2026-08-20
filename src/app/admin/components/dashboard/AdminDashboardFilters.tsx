'use client';

import React from 'react';

interface AdminDashboardFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'unpaid' | 'paid';
  setStatusFilter: (filter: 'all' | 'unpaid' | 'paid') => void;
  unpaidCount: number;
  paidCount: number;
  totalFilteredCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  handleToggleSelectAll: () => void;
  handleBatchMarkPaid: () => void;
  handleBatchDeleteOrders: () => void;
}

export function AdminDashboardFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  unpaidCount,
  paidCount,
  totalFilteredCount,
  selectedCount,
  isAllSelected,
  handleToggleSelectAll,
  handleBatchMarkPaid,
  handleBatchDeleteOrders,
}: AdminDashboardFiltersProps) {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 搜尋框 */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 搜尋團員暱稱或單號..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 pl-8 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* 付款狀態過濾按鈕 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            全部 ({totalFilteredCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 hover:bg-rose-100'
            }`}
          >
            未付款 ({unpaidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60 hover:bg-emerald-100'
            }`}
          >
            已付款 ({paidCount})
          </button>
        </div>
      </div>

      {/* 批次操作工具列 (全選、批次已付、批次刪除) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200 select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 rounded-md text-sky-500 focus:ring-sky-400"
          />
          <span>全選本頁篩選項目</span>
          {selectedCount > 0 && (
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-black">
              已選 {selectedCount} 筆
            </span>
          )}
        </label>

        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBatchMarkPaid}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>✅ 批次標記已付款 ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={handleBatchDeleteOrders}
              className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>🗑️ 批次刪除 ({selectedCount})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
