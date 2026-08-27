'use client';

import React from 'react';
import { Check, CheckCircle2, Clock } from 'lucide-react';

interface OrderStatusHeaderCardProps {
  orderNumber: string;
  isPaid: boolean;
}

export function OrderStatusHeaderCard({ orderNumber, isPaid }: OrderStatusHeaderCardProps) {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 shadow-2xs">
        <Check className="w-6 h-6 stroke-[3]" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          訂單已成功送出！
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 font-mono mt-0.5">
          訂單編號：#{orderNumber}
        </p>
      </div>

      {/* ⚡ Realtime 對帳狀態動態更新標籤 */}
      <div className="pt-1">
        {isPaid ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-xs animate-in zoom-in duration-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>團長已核實收到款項</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-extrabold px-4 py-1.5 rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>待團長對帳與確認</span>
          </span>
        )}
      </div>
    </div>
  );
}
