'use client';

import React from 'react';
import {
  Search,
  X,
  CheckCircle2,
  Circle,
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface AdminMenuStudioToolbarProps {
  productSearch: string;
  onSearchChange: (val: string) => void;
  itemStatusFilter: 'all' | 'active' | 'sold_out';
  onFilterChange: (val: 'all' | 'active' | 'sold_out') => void;
  totalCount: number;
  activeItemCount: number;
  soldOutItemCount: number;
  filteredCount: number;
  isFiltering: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  onManualSave: () => void;
}

export function AdminMenuStudioToolbar({
  productSearch,
  onSearchChange,
  itemStatusFilter,
  onFilterChange,
  totalCount,
  activeItemCount,
  soldOutItemCount,
  filteredCount,
  isFiltering,
  saveStatus,
  onManualSave,
}: AdminMenuStudioToolbarProps) {
  return (
    <div className="space-y-3 pl-2">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* 搜尋框 */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋餐點名稱或說明內容..."
            className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white/90 dark:bg-[#0E1726]/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition shadow-2xs"
          />
          {productSearch && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 上架狀態篩選 */}
        <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl text-xs font-black shrink-0 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              itemStatusFilter === 'all'
                ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            全部 ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('active')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              itemStatusFilter === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>上架中 ({activeItemCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('sold_out')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              itemStatusFilter === 'sold_out'
                ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Circle className="w-3 h-3" />
            <span>已下架 ({soldOutItemCount})</span>
          </button>
        </div>

        {/* 🌟 即時自動儲存狀態徽章 */}
        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 text-[11px] font-bold shadow-2xs">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>儲存排序中...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-bold shadow-2xs animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>排序已即時自動儲存 ✓</span>
            </span>
          )}
          {saveStatus === 'idle' && (
            <button
              type="button"
              onClick={onManualSave}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              title="手動確認儲存當前排序"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>排序就緒</span>
            </button>
          )}
        </div>
      </div>

      {/* 智慧功能提示 */}
      <div className="flex items-center gap-2 text-[11px] text-sky-700 dark:text-sky-300 font-bold bg-sky-50/90 dark:bg-sky-950/60 p-2.5 rounded-2xl border border-sky-100 dark:border-sky-900/50">
        <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
        <span>
          {isFiltering
            ? `🔍 目前正在篩選餐點（顯示 ${filteredCount} / 共 ${totalCount} 項），點擊箭頭按鈕將智慧相鄰挪動；清空篩選後即可長按或拖曳全店排序！`
            : '智慧排序：長按餐點模塊任一處（或電腦滑鼠按住拖曳）即可自由上下挪動順序！周圍品項將即時讓位。亦可使用卡片上的「置頂 (🔝)」、「上移 (▲)」、「下移 (▼)」、「置底 (⬇️)」按鈕快速調序！'}
        </span>
      </div>
    </div>
  );
}
