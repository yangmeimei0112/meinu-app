'use client';

import React from 'react';
import {
  Banknote,
  CheckCircle2,
  Landmark,
  CreditCard,
  Smartphone,
  Zap,
} from 'lucide-react';
import type { PaymentBreakdownItem } from './AdminDashboardMetrics';

// 動態金流主題色彩對照庫 (支援任意自訂新增金流，自動配色)
const PAYMENT_COLOR_PRESETS = [
  {
    icon: Banknote,
    match: ['現金', 'cash'],
    cardStyle: 'from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/30 dark:via-[#0E1E1C] dark:to-[#0B1519] border-emerald-200/80 dark:border-emerald-500/30',
    badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    totalColor: 'text-emerald-950 dark:text-emerald-100',
  },
  {
    icon: CheckCircle2,
    match: ['line', 'linepay', 'line pay'],
    cardStyle: 'from-green-500/10 via-emerald-500/5 to-white dark:from-green-950/30 dark:via-[#092215] dark:to-[#0B1713] border-green-200/80 dark:border-green-500/30',
    badgeStyle: 'bg-green-100 dark:bg-green-950/80 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/60',
    titleColor: 'text-green-800 dark:text-green-300',
    totalColor: 'text-green-950 dark:text-green-100',
  },
  {
    icon: Landmark,
    match: ['轉帳', '銀行', '匯款', 'bank', 'transfer'],
    cardStyle: 'from-sky-500/10 via-blue-500/5 to-white dark:from-sky-950/30 dark:via-[#0E1A33] dark:to-[#0A1224] border-sky-200/80 dark:border-sky-500/30',
    badgeStyle: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
    titleColor: 'text-sky-800 dark:text-sky-300',
    totalColor: 'text-sky-950 dark:text-sky-100',
  },
  {
    icon: CreditCard,
    match: ['街口', 'jkopay', 'jko'],
    cardStyle: 'from-rose-500/10 via-red-500/5 to-white dark:from-rose-950/30 dark:via-[#26131D] dark:to-[#170B12] border-rose-200/80 dark:border-rose-500/30',
    badgeStyle: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    titleColor: 'text-rose-800 dark:text-rose-300',
    totalColor: 'text-rose-950 dark:text-rose-100',
  },
  {
    icon: Smartphone,
    match: ['apple', 'applepay'],
    cardStyle: 'from-slate-500/10 via-zinc-500/5 to-white dark:from-slate-800/40 dark:via-[#161B26] dark:to-[#0D111A] border-slate-300/80 dark:border-slate-600/40',
    badgeStyle: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    titleColor: 'text-slate-800 dark:text-slate-200',
    totalColor: 'text-slate-900 dark:text-slate-100',
  },
];

const DEFAULT_COLOR_PRESET = {
  icon: Zap,
  cardStyle: 'from-indigo-500/10 via-purple-500/5 to-white dark:from-indigo-950/30 dark:via-[#18132B] dark:to-[#0E0B19] border-indigo-200/80 dark:border-indigo-500/30',
  badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
  titleColor: 'text-indigo-800 dark:text-indigo-300',
  totalColor: 'text-indigo-950 dark:text-indigo-100',
};

interface AdminDashboardPaymentBreakdownProps {
  paymentBreakdown?: PaymentBreakdownItem[];
  // Legacy / fallback props
  cashPaid?: number;
  cashUnpaid?: number;
  linePayPaid?: number;
  linePayUnpaid?: number;
  transferPaid?: number;
  transferUnpaid?: number;
}

export function AdminDashboardPaymentBreakdown({
  paymentBreakdown,
  cashPaid = 0,
  cashUnpaid = 0,
  linePayPaid = 0,
  linePayUnpaid = 0,
  transferPaid = 0,
  transferUnpaid = 0,
}: AdminDashboardPaymentBreakdownProps) {
  // 自動解析金流陣列 (優先使用動態 paymentBreakdown，若無則降級使用 legacy props)
  const items: PaymentBreakdownItem[] =
    paymentBreakdown && paymentBreakdown.length > 0
      ? paymentBreakdown
      : [
          { name: '現金支付', paid: cashPaid, unpaid: cashUnpaid, total: cashPaid + cashUnpaid },
          { name: 'LINE Pay', paid: linePayPaid, unpaid: linePayUnpaid, total: linePayPaid + linePayUnpaid },
          { name: '銀行轉帳', paid: transferPaid, unpaid: transferUnpaid, total: transferPaid + transferUnpaid },
        ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>💳 付款方式即時對帳</span>
          <span className="text-[10px] text-slate-400 font-normal">（含各金流已收 / 未收統計）</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, idx) => {
          const lowerName = item.name.toLowerCase();
          const preset =
            PAYMENT_COLOR_PRESETS.find((p) => p.match.some((m) => lowerName.includes(m))) ||
            DEFAULT_COLOR_PRESET;
          const IconComp = preset.icon;

          return (
            <div
              key={`${item.name}-${idx}`}
              className={`relative overflow-hidden bg-gradient-to-br ${preset.cardStyle} p-4 rounded-3xl border shadow-xs transition-all hover:shadow-md space-y-3 backdrop-blur-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-xl border ${preset.badgeStyle}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-black ${preset.titleColor}`}>{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">總計</span>
                  <span className={`text-sm font-black font-mono ${preset.totalColor}`}>${item.total}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">已收齊</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    ${item.paid}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">待收</span>
                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
                    ${item.unpaid}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
