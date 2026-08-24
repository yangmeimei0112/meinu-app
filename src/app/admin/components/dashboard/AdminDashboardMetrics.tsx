'use client';

import React from 'react';
import { GroupOrderAdmin } from '../../admin-types';

export interface PaymentBreakdownItem {
  name: string;
  paid: number;
  unpaid: number;
  total: number;
}

interface AdminDashboardMetricsProps {
  groupOrder: GroupOrderAdmin | null;
  activeGroups?: GroupOrderAdmin[];
  selectedActiveGroupId?: string;
  onSelectActiveGroup?: (groupId: string) => void;
  grandTotal: number;
  paidTotal: number;
  submissionsCount: number;
  totalItemCount: number;
  unpaidSubmissionsCount: number;
  paymentBreakdown?: PaymentBreakdownItem[];
  // Legacy / fallback props
  cashPaid?: number;
  cashUnpaid?: number;
  linePayPaid?: number;
  linePayUnpaid?: number;
  transferPaid?: number;
  transferUnpaid?: number;
  handleToggleGroupStatus: (newStatus: 'open' | 'closed') => void;
  handleOpenGroupSettingsModal?: () => void;
  handleArchiveGroup: () => void;
  handleExportOrdersCSV: () => void;
  handleCopyUnpaidReminder: () => void;
  handleOpenPrintModal: () => void;
  handleOpenManualOrderModal: () => void;
}

// 🎨 動態金流主題色彩對照庫 (支援任意自訂新增金流，自動配色)
const PAYMENT_COLOR_PRESETS = [
  {
    icon: '💵',
    match: ['現金', 'cash'],
    cardStyle: 'from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/30 dark:via-[#0E1E1C] dark:to-[#0B1519] border-emerald-200/80 dark:border-emerald-500/30',
    badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    totalColor: 'text-emerald-950 dark:text-emerald-100',
  },
  {
    icon: '🟢',
    match: ['line', 'linepay', 'line pay'],
    cardStyle: 'from-green-500/10 via-emerald-500/5 to-white dark:from-green-950/30 dark:via-[#092215] dark:to-[#0B1713] border-green-200/80 dark:border-green-500/30',
    badgeStyle: 'bg-green-100 dark:bg-green-950/80 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/60',
    titleColor: 'text-green-800 dark:text-green-300',
    totalColor: 'text-green-950 dark:text-green-100',
  },
  {
    icon: '🏦',
    match: ['轉帳', '銀行', '匯款', 'bank', 'transfer'],
    cardStyle: 'from-sky-500/10 via-blue-500/5 to-white dark:from-sky-950/30 dark:via-[#0E1A33] dark:to-[#0A1224] border-sky-200/80 dark:border-sky-500/30',
    badgeStyle: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60',
    titleColor: 'text-sky-800 dark:text-sky-300',
    totalColor: 'text-sky-950 dark:text-sky-100',
  },
  {
    icon: '💳',
    match: ['街口', 'jkopay', 'jko'],
    cardStyle: 'from-rose-500/10 via-red-500/5 to-white dark:from-rose-950/30 dark:via-[#26131D] dark:to-[#170B12] border-rose-200/80 dark:border-rose-500/30',
    badgeStyle: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    titleColor: 'text-rose-800 dark:text-rose-300',
    totalColor: 'text-rose-950 dark:text-rose-100',
  },
  {
    icon: '🍎',
    match: ['apple', 'applepay'],
    cardStyle: 'from-slate-500/10 via-zinc-500/5 to-white dark:from-slate-800/40 dark:via-[#161B26] dark:to-[#0D111A] border-slate-300/80 dark:border-slate-600/40',
    badgeStyle: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    titleColor: 'text-slate-800 dark:text-slate-200',
    totalColor: 'text-slate-900 dark:text-slate-100',
  },
  {
    icon: '⚡',
    match: ['台灣pay', 'taiwanpay', '悠遊', 'icash', '一卡通'],
    cardStyle: 'from-amber-500/10 via-orange-500/5 to-white dark:from-amber-950/30 dark:via-[#241B0E] dark:to-[#171008] border-amber-200/80 dark:border-amber-500/30',
    badgeStyle: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    titleColor: 'text-amber-800 dark:text-amber-300',
    totalColor: 'text-amber-950 dark:text-amber-100',
  },
  {
    icon: '🔮',
    match: ['信用卡', 'credit', 'stripe'],
    cardStyle: 'from-purple-500/10 via-indigo-500/5 to-white dark:from-purple-950/30 dark:via-[#1B132F] dark:to-[#100B1D] border-purple-200/80 dark:border-purple-500/30',
    badgeStyle: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    titleColor: 'text-purple-800 dark:text-purple-300',
    totalColor: 'text-purple-950 dark:text-purple-100',
  },
];

function getPaymentPreset(name: string, index: number) {
  const lower = name.toLowerCase();
  const matched = PAYMENT_COLOR_PRESETS.find((p) => p.match.some((m) => lower.includes(m)));
  if (matched) return matched;
  return PAYMENT_COLOR_PRESETS[index % PAYMENT_COLOR_PRESETS.length];
}

export function AdminDashboardMetrics({
  groupOrder,
  activeGroups = [],
  selectedActiveGroupId = 'all',
  onSelectActiveGroup,
  grandTotal,
  paidTotal,
  submissionsCount,
  totalItemCount,
  unpaidSubmissionsCount,
  paymentBreakdown,
  cashPaid = 0,
  cashUnpaid = 0,
  linePayPaid = 0,
  linePayUnpaid = 0,
  transferPaid = 0,
  transferUnpaid = 0,
  handleToggleGroupStatus,
  handleOpenGroupSettingsModal,
  handleArchiveGroup,
  handleExportOrdersCSV,
  handleCopyUnpaidReminder,
  handleOpenPrintModal,
  handleOpenManualOrderModal,
}: AdminDashboardMetricsProps) {
  const isClosed = groupOrder?.status === 'closed';

  // 整理金流清單：若有動態 paymentBreakdown 則直接採用，否則以預設三大金流作為備援
  const activePaymentList: PaymentBreakdownItem[] =
    paymentBreakdown && paymentBreakdown.length > 0
      ? paymentBreakdown
      : [
          { name: '現金收款', paid: cashPaid, unpaid: cashUnpaid, total: cashPaid + cashUnpaid },
          { name: 'LINE Pay', paid: linePayPaid, unpaid: linePayUnpaid, total: linePayPaid + linePayUnpaid },
          { name: '銀行轉帳', paid: transferPaid, unpaid: transferUnpaid, total: transferPaid + transferUnpaid },
        ].filter((p) => p.total > 0 || (cashPaid + linePayPaid + transferPaid === 0 && p.name === '現金收款'));

  const paidPercentage = grandTotal > 0 ? Math.round((paidTotal / grandTotal) * 100) : 0;
  const unpaidTotal = Math.max(0, grandTotal - paidTotal);

  return (
    <div className="space-y-5">
      {/* 🚀 多活動快速切換頁籤 (若有複數進行中活動) */}
      {activeGroups.length > 1 && onSelectActiveGroup && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectActiveGroup('all')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition shrink-0 cursor-pointer shadow-xs ${
              selectedActiveGroupId === 'all'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white ring-2 ring-sky-400/40 shadow-sky-500/20'
                : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            全部活動總覽 ({activeGroups.length})
          </button>
          {activeGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectActiveGroup(g.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition shrink-0 cursor-pointer shadow-xs ${
                selectedActiveGroupId === g.id
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white ring-2 ring-sky-400/40 shadow-sky-500/20'
                  : 'bg-white dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {/* 👑 團購活動控制頂部橫幅 (Commander Zone) */}
      {groupOrder && (
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-50/90 via-white/95 to-indigo-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-sky-200/80 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(56,189,248,0.12)] space-y-4">
          {/* 左側 4px 亮藍漸層高光飾條 */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-500" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 pl-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <span>{groupOrder.title}</span>
                </h2>
                <span
                  className={`text-xs font-extrabold px-3 py-0.5 rounded-full border shadow-2xs ${
                    isClosed
                      ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800/80'
                      : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 animate-pulse'
                  }`}
                >
                  {isClosed ? '🔒 已截單 (停止收單)' : '🟢 開放收單中'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                <span>🏪 合作店家：</span>
                <span className="bg-white/80 dark:bg-slate-800/90 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-lg border border-sky-100 dark:border-sky-900/60 font-bold flex items-center gap-1.5">
                  {groupOrder.stores?.code && (
                    <span className="bg-slate-900 text-white dark:bg-sky-500 font-mono font-black text-[10px] px-1.5 py-0.5 rounded">
                      {groupOrder.stores.code}
                    </span>
                  )}
                  <span>{groupOrder.stores?.name || '未指定門市'}</span>
                </span>
              </p>
            </div>

            {/* 主控開關與設定操作按鈕群 */}
            <div className="flex items-center gap-2 flex-wrap pl-2 lg:pl-0">
              <button
                type="button"
                onClick={() => handleToggleGroupStatus(isClosed ? 'open' : 'closed')}
                className={`px-4 py-2 rounded-2xl font-black text-xs transition active:scale-95 cursor-pointer shadow-sm ${
                  isClosed
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-500/25'
                }`}
              >
                {isClosed ? '🟢 重新開放收單' : '🔒 截單 (停止收單)'}
              </button>

              {handleOpenGroupSettingsModal && (
                <button
                  type="button"
                  onClick={handleOpenGroupSettingsModal}
                  className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-2xl font-extrabold text-xs transition border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>⚙️ 活動設定</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleArchiveGroup}
                className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-2xl font-extrabold text-xs transition border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>📦 結單歸檔</span>
              </button>
            </div>
          </div>

          {/* 快捷工具條 (代點、列印、CSV、催繳) */}
          <div className="pt-3 border-t border-sky-100/90 dark:border-sky-900/40 flex items-center gap-2 flex-wrap pl-2">
            <button
              type="button"
              onClick={handleOpenManualOrderModal}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕ 幫朋友代點</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition border border-slate-200/80 dark:border-slate-700 shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️ 友善列印</span>
            </button>
            <button
              type="button"
              onClick={handleExportOrdersCSV}
              className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition border border-slate-200/80 dark:border-slate-700 shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊 匯出 CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopyUnpaidReminder}
              className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/60 dark:hover:to-orange-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/70 font-black text-xs px-3.5 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>📢 催繳文字 ({unpaidSubmissionsCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* 📊 4 大核心財務與營收指標 Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. 全團總金額 */}
        <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-white dark:from-[#0F1C36] dark:via-[#0B152A] dark:to-[#070D1A] rounded-3xl p-4 sm:p-5 border border-blue-200/90 dark:border-blue-500/30 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>💰 全團總金額</span>
            </span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/60">
              {submissionsCount} 筆訂單
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-950 dark:text-blue-100 tracking-tight font-mono">
            ${grandTotal}
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
            含外送與折扣後之應收全額
          </span>
        </div>

        {/* 2. 已收款總額 */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:from-[#0B2524] dark:via-[#081C1B] dark:to-[#051312] rounded-3xl p-4 sm:p-5 border border-emerald-200/90 dark:border-emerald-500/30 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span>✅ 已收款總額</span>
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              {paidPercentage}% 已入帳
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight font-mono">
            ${paidTotal}
          </p>
          <div className="w-full bg-emerald-100 dark:bg-emerald-950/60 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </div>

        {/* 3. 待收餘額 */}
        <div className="bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-white dark:from-[#28131E] dark:via-[#1F0E17] dark:to-[#14080F] rounded-3xl p-4 sm:p-5 border border-rose-200/90 dark:border-rose-500/30 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <span>⏳ 待收餘額</span>
            </span>
            {unpaidSubmissionsCount > 0 ? (
              <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60 animate-pulse">
                {unpaidSubmissionsCount} 人待付
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                全員已清
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
            ${unpaidTotal}
          </p>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-semibold block">
            {unpaidSubmissionsCount > 0 ? `尚有 ${unpaidSubmissionsCount} 筆訂單待核對` : '🎉 全體團員已全額付款'}
          </span>
        </div>

        {/* 4. 餐點總份數 */}
        <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-white dark:from-[#241C10] dark:via-[#1B140A] dark:to-[#120D05] rounded-3xl p-4 sm:p-5 border border-amber-200/90 dark:border-amber-500/30 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>🍔 餐點總份數</span>
            </span>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
              叫餐基準
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-300 tracking-tight font-mono">
            {totalItemCount} <span className="text-sm font-bold">份</span>
          </p>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block">
            向店家報單專用總杯/份數
          </span>
        </div>
      </div>

      {/* 💳 金流動態分流卡片 (支援任意新增自訂金流，自動配色) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(activePaymentList.length, 4)} gap-3.5`}>
        {activePaymentList.map((pm, idx) => {
          const preset = getPaymentPreset(pm.name, idx);
          return (
            <div
              key={pm.name + idx}
              className={`bg-gradient-to-r ${preset.cardStyle} rounded-2xl p-4 border shadow-xs flex items-center justify-between transition hover:scale-[1.01]`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{preset.icon}</span>
                  <span className={`text-xs font-black ${preset.titleColor}`}>{pm.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  已收 ${pm.paid} / 待收{' '}
                  <span className={pm.unpaid > 0 ? 'text-rose-500 font-black' : 'text-slate-400'}>
                    ${pm.unpaid}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-black font-mono block ${preset.totalColor}`}>
                  ${pm.total}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${preset.badgeStyle}`}>
                  {pm.total > 0 && pm.unpaid === 0 ? '全收訖' : pm.unpaid > 0 ? `待收 $${pm.unpaid}` : '無單'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
