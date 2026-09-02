'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  CheckCircle2,
  Trash2,
  ChefHat,
  ShoppingBag,
  Clock,
  XCircle,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { OrderProgressStatus } from '@/types/orderStatus';

interface AdminDashboardFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'unpaid' | 'paid';
  setStatusFilter: (filter: 'all' | 'unpaid' | 'paid') => void;
  progressFilter: 'all' | OrderProgressStatus;
  setProgressFilter: (filter: 'all' | OrderProgressStatus) => void;
  unpaidCount: number;
  paidCount: number;
  totalFilteredCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  handleToggleSelectAll: () => void;
  handleBatchMarkPaid: () => void;
  handleBatchUpdateProgress?: (newStatus: OrderProgressStatus) => void;
  handleBatchDeleteOrders: () => void;
}

export function AdminDashboardFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  progressFilter,
  setProgressFilter,
  unpaidCount,
  paidCount,
  totalFilteredCount,
  selectedCount,
  isAllSelected,
  handleToggleSelectAll,
  handleBatchMarkPaid,
  handleBatchUpdateProgress,
  handleBatchDeleteOrders,
}: AdminDashboardFiltersProps) {
  const [isBatchStatusOpen, setIsBatchStatusOpen] = useState(false);

  return (
    <div className="bg-white/95 dark:bg-[#0E1726]/95 rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-3 backdrop-blur-md">
      {/* 第一列：搜尋框與付款狀態過濾 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 搜尋框 */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="搜尋團員暱稱或單號..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/90 dark:bg-[#152033] border border-slate-200 dark:border-slate-700/80 rounded-2xl py-2.5 px-3.5 pl-9 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-300 transition cursor-pointer"
              aria-label="清除搜尋"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 🏷️ 付款狀態過濾按鈕膠囊列 */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-[#152033] p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            全部 ({totalFilteredCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'unpaid'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-500/20'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            未付款 ({unpaidCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              statusFilter === 'paid'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            已付款 ({paidCount})
          </button>
        </div>
      </div>

      {/* 第二列：訂單進度狀態過濾 (全部 / 待確認 / 製作中 / 待取餐 / 已完成 / 已取消) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 shrink-0 mr-1">
          進度篩選:
        </span>
        {[
          { key: 'all', label: '全部進度' },
          { key: 'pending', label: '待確認' },
          { key: 'preparing', label: '製作中' },
          { key: 'ready', label: '待取餐' },
          { key: 'completed', label: '已完成' },
          { key: 'cancelled', label: '已取消' },
        ].map((item) => {
          const isActive = progressFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setProgressFilter(item.key as any)}
              className={`px-3 py-1 rounded-xl text-[11px] font-black transition whitespace-nowrap cursor-pointer border ${
                isActive
                  ? 'bg-sky-500 text-white border-sky-500 shadow-xs shadow-sky-500/20'
                  : 'bg-slate-50 dark:bg-[#121B2A] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 🛠️ 批次操作工具列 (全選、批次進度更新、批次已付、批次刪除) */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <label className="flex items-center gap-2.5 cursor-pointer font-black text-slate-700 dark:text-slate-200 select-none">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            className="w-4 h-4 rounded-md text-sky-500 focus:ring-sky-400 cursor-pointer accent-sky-500"
          />
          <span>全選本頁篩選項目</span>
          {selectedCount > 0 && (
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full font-black border border-sky-200 dark:border-sky-800/60">
              已選取 {selectedCount} 筆
            </span>
          )}
        </label>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* 批次設定進度下拉選單 */}
            {handleBatchUpdateProgress && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBatchStatusOpen(!isBatchStatusOpen)}
                  className="bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-black text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>批次改進度</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isBatchStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsBatchStatusOpen(false)} />
                    <div className="absolute right-0 bottom-full mb-1.5 z-50 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-2xl min-w-[140px] space-y-1">
                      {[
                        { key: 'preparing', label: '標記為「製作中」', icon: ChefHat, color: 'text-sky-500' },
                        { key: 'ready', label: '標記為「待取餐」', icon: ShoppingBag, color: 'text-indigo-500' },
                        { key: 'completed', label: '標記為「已完成」', icon: CheckCircle2, color: 'text-emerald-500' },
                        { key: 'cancelled', label: '標記為「已取消」', icon: XCircle, color: 'text-rose-500' },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              handleBatchUpdateProgress(item.key as any);
                              setIsBatchStatusOpen(false);
                            }}
                            className="w-full text-left text-xs font-black px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleBatchMarkPaid}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>批次已付款 ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={handleBatchDeleteOrders}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>批次刪除 ({selectedCount})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
