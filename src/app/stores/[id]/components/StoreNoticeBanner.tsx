'use client';

import React from 'react';
import { Megaphone, Flame, Clock, Truck, CheckCircle2, PauseCircle } from 'lucide-react';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';

export interface StoreLiveMeta {
  id?: string;
  announcement?: string | null;
  status?: 'open' | 'closed' | 'completed';
  is_accepting_orders?: boolean;
  show_order_progress?: boolean;
  enable_min_threshold?: boolean;
  min_threshold_amount?: number;
  enable_countdown?: boolean;
  cutoff_time?: string | null;
  enable_budget_limit?: boolean;
  budget_limit_amount?: number;
}

export type GroupOrderMeta = StoreLiveMeta;

interface StoreNoticeBannerProps {
  storeMeta: StoreLiveMeta | null;
  currentStoreTotal: number;
  groupTotalAmount: number;
  countdownSeconds: number;
}

export function StoreNoticeBanner({
  storeMeta,
  currentStoreTotal,
  groupTotalAmount,
  countdownSeconds,
}: StoreNoticeBannerProps) {
  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isPaused =
    storeMeta?.is_accepting_orders === false ||
    (storeMeta?.enable_countdown && storeMeta?.cutoff_time && countdownSeconds <= 0);

  const isUrgent = countdownSeconds > 0 && countdownSeconds <= 300;

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* ⏸️ 暫停接單溫馨提示卡片 */}
      {isPaused && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="font-extrabold text-xs text-amber-900 dark:text-amber-200">
              店家目前暫停接單中
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-normal mt-0.5">
              您仍可自由瀏覽菜單並加入購物車，待店家恢復接單後即可隨時前往結帳！
            </p>
          </div>
        </div>
      )}

      {/* 📢 店家即時公告 */}
      {storeMeta?.announcement && (
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-3 shadow-xs text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
          <Megaphone className="w-4 h-4 shrink-0 text-white" />
          <p className="line-clamp-2">{storeMeta.announcement}</p>
        </div>
      )}

      {/* 🏢 公費預算補貼提示 */}
      {storeMeta?.enable_budget_limit && storeMeta?.budget_limit_amount && (
        <BudgetLimitNotice
          budgetLimit={storeMeta.budget_limit_amount}
          totalAmount={currentStoreTotal}
        />
      )}

      {storeMeta && (
        <div className="grid grid-cols-1 gap-2">
          {/* ⏱️ 截單倒數計時器 */}
          {storeMeta.enable_countdown && (
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

          {/* 🔥 全團點餐進度卡片 (依照店家營運設定 show_order_progress 控制) */}
          {storeMeta.show_order_progress !== false && !storeMeta.enable_min_threshold && groupTotalAmount > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-sky-500/10 dark:from-amber-950/30 dark:via-slate-900/40 dark:to-sky-950/30 border border-amber-200/60 dark:border-amber-900/40 text-slate-800 dark:text-slate-100 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>全團點餐進度</span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    目前已累計 <span className="font-extrabold text-sky-600 dark:text-sky-400">${groupTotalAmount} 元</span>
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 shadow-2xs shrink-0">
                <span>熱烈點餐中</span>
              </div>
            </div>
          )}

          {/* 🚚 起送 / 免運滿額進度條 (依照店家設定 enable_min_threshold 與 show_order_progress 控制) */}
          {storeMeta.enable_min_threshold && storeMeta.min_threshold_amount && storeMeta.show_order_progress !== false && (
            <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-3 border border-sky-100 dark:border-slate-800 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>全團點餐進度</span>
                  <span className="text-sky-600 dark:text-sky-400">
                    (${groupTotalAmount} / ${storeMeta.min_threshold_amount})
                  </span>
                </span>
                <span className="text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  {groupTotalAmount >= storeMeta.min_threshold_amount ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>已達標！</span>
                    </>
                  ) : (
                    `還差 $${storeMeta.min_threshold_amount - groupTotalAmount} 元`
                  )}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-blue-500 h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (groupTotalAmount / storeMeta.min_threshold_amount) * 100
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
