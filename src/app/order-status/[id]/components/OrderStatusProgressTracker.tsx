'use client';

import React from 'react';
import {
  OrderProgressStatus,
  ORDER_PROGRESS_STEPS,
  ORDER_STATUS_META,
} from '@/types/orderStatus';
import {
  Clock,
  ChefHat,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Sparkles,
  Radio,
} from 'lucide-react';

interface OrderStatusProgressTrackerProps {
  status: OrderProgressStatus;
  orderNumber: string;
  userNickname: string;
}

export function OrderStatusProgressTracker({
  status,
  orderNumber,
  userNickname,
}: OrderStatusProgressTrackerProps) {
  const meta = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
  const isCancelled = status === 'cancelled';
  const currentStepIdx = isCancelled ? -1 : meta.stepIndex;

  // 渲染狀態主要圖示
  const renderStatusIcon = () => {
    switch (status) {
      case 'preparing':
        return <ChefHat className="w-6 h-6 text-sky-500 dark:text-sky-400 animate-bounce" />;
      case 'ready':
        return <ShoppingBag className="w-6 h-6 text-indigo-500 dark:text-indigo-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-rose-500 dark:text-rose-400" />;
      case 'pending':
      default:
        return <Clock className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-spin-slow" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-300">
      {/* 👑 頂部即時狀態橫幅 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 transition-colors ${
              isCancelled
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60'
                : status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60'
                : status === 'ready'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60'
                : status === 'preparing'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900/60'
                : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60'
            }`}
          >
            {renderStatusIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
              >
                {meta.label}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono font-bold">
                #{orderNumber}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {meta.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
              {meta.description}
            </p>
          </div>
        </div>

        {/* 實時動態連線指示燈 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">實時同步</span>
        </div>
      </div>

      {/* 🚀 訂單進度流程表 (Stepper Timeline) */}
      {!isCancelled ? (
        <div className="pt-3 pb-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            {/* 連接線 (Background Line) */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-slate-100 dark:bg-slate-800 rounded-full z-0" />

            {/* 進行中連線 (Active Gradient Line) */}
            <div
              className="absolute top-4 left-6 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, (currentStepIdx / (ORDER_PROGRESS_STEPS.length - 1)) * 88))}%`,
              }}
            />

            {/* 步驟節點 */}
            <div className="relative z-10 flex items-start justify-between">
              {ORDER_PROGRESS_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isFuture = idx > currentStepIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center w-16 select-none">
                    {/* 節點圓圈 */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                        isPassed
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30 scale-110 ring-4 ring-sky-400/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200/80 dark:border-slate-700/60'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : isCurrent ? (
                        <span className="animate-pulse">{step.stepNumber}</span>
                      ) : (
                        <span>{step.stepNumber}</span>
                      )}
                    </div>

                    {/* 步驟標題 */}
                    <span
                      className={`text-[11px] mt-2 font-black transition-colors ${
                        isCurrent
                          ? 'text-sky-600 dark:text-sky-400 font-black scale-105'
                          : isPassed
                          ? 'text-slate-700 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600 font-medium'
                      }`}
                    >
                      {step.label}
                    </span>

                    {/* 當前進行中動態標記 */}
                    {isCurrent && (
                      <span className="mt-0.5 text-[9px] text-sky-500 dark:text-sky-400 font-bold animate-pulse">
                        進行中
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ⚠️ 訂單已取消專屬提示區塊 */
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-extrabold">此筆訂單已被取消</p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              店家或團長已將此訂單取消，若有已付款項將由團長進行退款手續。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
