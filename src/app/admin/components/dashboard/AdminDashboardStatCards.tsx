'use client';

import React from 'react';
import { Coins, CheckCircle2, UtensilsCrossed, Clock } from 'lucide-react';

interface AdminDashboardStatCardsProps {
  grandTotal: number;
  paidTotal: number;
  submissionsCount: number;
  totalItemCount: number;
  unpaidSubmissionsCount: number;
  onCopyUnpaidReminder: () => void;
}

export function AdminDashboardStatCards({
  grandTotal,
  paidTotal,
  submissionsCount,
  totalItemCount,
  unpaidSubmissionsCount,
  onCopyUnpaidReminder,
}: AdminDashboardStatCardsProps) {
  const unpaidTotal = Math.max(0, grandTotal - paidTotal);
  const paidPercent = grandTotal > 0 ? Math.round((paidTotal / grandTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. 總應收金額 */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2B]/95 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">總應收金額</span>
          <div className="w-8 h-8 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
            ${grandTotal}
          </span>
          <span className="text-xs font-bold text-slate-400">元</span>
        </div>
        <div className="text-[11px] text-slate-400 font-semibold">
          共 {submissionsCount} 位成員參與
        </div>
      </div>

      {/* 2. 已收總額 (含達成率) */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2B]/95 p-4 sm:p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-500/30 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.08)] backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">已收總額</span>
          <div className="w-8 h-8 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            ${paidTotal}
          </span>
          <span className="text-xs font-bold text-emerald-500">元</span>
        </div>
        {/* 進度條 */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, paidPercent)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold text-right">
            已收齊 {paidPercent}%
          </div>
        </div>
      </div>

      {/* 3. 待收總額 (催繳捷徑) */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2B]/95 p-4 sm:p-5 rounded-3xl border border-amber-200/80 dark:border-amber-500/30 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.08)] backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">未收餘額</span>
          <div className="w-8 h-8 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            ${unpaidTotal}
          </span>
          <span className="text-xs font-bold text-amber-500">元</span>
        </div>
        {unpaidSubmissionsCount > 0 ? (
          <button
            type="button"
            onClick={onCopyUnpaidReminder}
            className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900/80 px-2 py-0.5 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <span>還有 {unpaidSubmissionsCount} 人待繳 (點此複製催繳)</span>
          </button>
        ) : (
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>全體皆已結清！</span>
          </div>
        )}
      </div>

      {/* 4. 總餐點件數 */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#131B2B]/95 p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">總點餐件數</span>
          <div className="w-8 h-8 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
            {totalItemCount}
          </span>
          <span className="text-xs font-bold text-slate-400">份</span>
        </div>
        <div className="text-[11px] text-slate-400 font-semibold">
          平均每單 {submissionsCount > 0 ? (totalItemCount / submissionsCount).toFixed(1) : 0} 份
        </div>
      </div>
    </div>
  );
}
