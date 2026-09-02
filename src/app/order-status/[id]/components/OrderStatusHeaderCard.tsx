'use client';

import React from 'react';
import { Check, CheckCircle2, Clock, ShieldCheck, Tag } from 'lucide-react';
import { OrderProgressStatus, ORDER_STATUS_META } from '@/types/orderStatus';

interface OrderStatusHeaderCardProps {
  orderNumber: string;
  isPaid: boolean;
  progressStatus?: OrderProgressStatus;
}

export function OrderStatusHeaderCard({
  orderNumber,
  isPaid,
  progressStatus = 'pending',
}: OrderStatusHeaderCardProps) {
  const meta = ORDER_STATUS_META[progressStatus] || ORDER_STATUS_META.pending;

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 shadow-2xs">
        <Check className="w-6 h-6 stroke-[3]" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          訂單已成功送出！
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 font-mono mt-0.5 font-bold">
          訂單編號：#{orderNumber}
        </p>
      </div>

      {/* ⚡ Realtime 狀態動態標籤區 */}
      <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
        {/* 訂單進度標籤 */}
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full border shadow-2xs ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
        >
          <Tag className="w-3 h-3" />
          <span>訂單狀態：{meta.label}</span>
        </span>

        {/* 付款對帳標籤 */}
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-xs animate-in zoom-in duration-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>已核銷付款</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-extrabold px-3.5 py-1.5 rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>待收款確認</span>
          </span>
        )}
      </div>
    </div>
  );
}
