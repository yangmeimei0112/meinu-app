'use client';

import React from 'react';
import { Archive, Search, CheckSquare, Square, Trash2 } from 'lucide-react';

interface AdminArchiveFiltersProps {
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isAllSelected: boolean;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onExecuteBatchDelete: () => void;
}

export function AdminArchiveFilters({
  totalCount,
  searchQuery,
  onSearchChange,
  isAllSelected,
  selectedCount,
  onToggleSelectAll,
  onExecuteBatchDelete,
}: AdminArchiveFiltersProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-100/90 via-white/95 to-sky-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] space-y-4">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-slate-400 via-sky-500 to-indigo-500" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
        <div>
          <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-sky-500" />
            <span>歷史團購活動歸檔</span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-3 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs">
              共 {totalCount} 個歷史活動
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            過去已結案的歷史團購活動紀錄，點擊可展開查看歷史訂單明細，亦可一鍵複製重開新團或清理過期紀錄。
          </p>
        </div>

        {/* 搜尋與全選/批次刪除工具列 */}
        <div className="flex items-center gap-2 flex-wrap">
          {totalCount > 0 && (
            <>
              {/* 搜尋輸入框 */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="搜尋歷史活動或店家..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl py-2 pl-8 pr-3 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={onToggleSelectAll}
                className={`text-xs px-3.5 py-2 rounded-2xl font-black transition flex items-center gap-1.5 border active:scale-95 cursor-pointer shadow-2xs ${
                  isAllSelected
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-500'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {isAllSelected ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>取消全選</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>全選</span>
                  </>
                )}
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={onExecuteBatchDelete}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs px-4 py-2 rounded-2xl font-black transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer animate-in fade-in duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>批次刪除 ({selectedCount})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
