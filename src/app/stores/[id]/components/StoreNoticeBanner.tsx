'use client';

import React from 'react';
import { Lock, Megaphone, Flame, Clock, Truck, CheckCircle2 } from 'lucide-react';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';

export interface GroupOrderMeta {
  id: string;
  announcement: string | null;
  status: 'open' | 'closed' | 'completed';
  enable_min_threshold: boolean;
  min_threshold_amount: number;
  enable_countdown: boolean;
  cutoff_time: string | null;
  enable_budget_limit?: boolean;
  budget_limit_amount?: number;
}

interface StoreNoticeBannerProps {
  isGroupClosed: boolean;
  groupMeta: GroupOrderMeta | null;
  currentStoreTotal: number;
  groupTotalAmount: number;
  countdownSeconds: number;
}

export function StoreNoticeBanner({
  isGroupClosed,
  groupMeta,
  currentStoreTotal,
  groupTotalAmount,
  countdownSeconds,
}: StoreNoticeBannerProps) {
  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isUrgent = countdownSeconds > 0 && countdownSeconds <= 300;

  return (
    <div className="space-y-2.5">
      {isGroupClosed && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-xs">
          <Lock className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-extrabold text-rose-800 dark:text-rose-300">團長已截單，停止收單中</p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-normal mt-0.5">
              此團購活動已截止，無法新增餐點與送出訂單。
            </p>
          </div>
        </div>
      )}

      {groupMeta?.announcement && (
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-3 shadow-xs text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <Megaphone className="w-4 h-4 shrink-0 text-white" />
          <p className="line-clamp-2">{groupMeta.announcement}</p>
        </div>
      )}

      {groupMeta?.enable_budget_limit && groupMeta?.budget_limit_amount && (
        <BudgetLimitNotice
          budgetLimit={groupMeta.budget_limit_amount}
          totalAmount={currentStoreTotal}
        />
      )}

      {groupMeta && (
        <div className="grid grid-cols-1 gap-2">
          {groupMeta.enable_countdown && (
            <div
              className={`rounded-2xl p-3 flex items-center justify-between border shadow-xs transition-colors ${
                isUrgent
                  ? 'bg-rose-950 text-rose-200 border-rose-800 animate-pulse'
                  : 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {isUrgent ? (
                  <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className="text-xs font-bold">
                  {isUrgent ? '即將截單！把握時間' : '預計截單倒數'}
                </span>
              </div>
              <span
                className={`font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-lg border ${
                  isUrgent
                    ? 'bg-rose-900 text-rose-300 border-rose-700'
                    : 'text-sky-400 bg-slate-800 dark:bg-slate-950 border-slate-700 dark:border-slate-700'
                }`}
              >
                {countdownSeconds > 0 ? formatCountdown(countdownSeconds) : '已截止收單'}
              </span>
            </div>
          )}

          {groupMeta.enable_min_threshold && (
            <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-3 border border-sky-100 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>起送湊單進度</span>
                  <span className="text-sky-600 dark:text-sky-400">
                    (${groupTotalAmount} / ${groupMeta.min_threshold_amount})
                  </span>
                </span>
                <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  {groupTotalAmount >= groupMeta.min_threshold_amount ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>已達標！</span>
                    </>
                  ) : (
                    `還差 $${groupMeta.min_threshold_amount - groupTotalAmount} 元`
                  )}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-blue-500 h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (groupTotalAmount / groupMeta.min_threshold_amount) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
