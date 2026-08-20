'use client';

import React from 'react';
import { GroupOrderAdmin } from '../../admin-types';

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
  cashPaid: number;
  cashUnpaid: number;
  linePayPaid: number;
  linePayUnpaid: number;
  transferPaid: number;
  transferUnpaid: number;
  handleToggleGroupStatus: (newStatus: 'open' | 'closed') => void;
  handleOpenGroupSettingsModal?: () => void;
  handleArchiveGroup: () => void;
  handleExportOrdersCSV: () => void;
  handleCopyUnpaidReminder: () => void;
  handleOpenPrintModal: () => void;
  handleOpenManualOrderModal: () => void;
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
  cashPaid,
  cashUnpaid,
  linePayPaid,
  linePayUnpaid,
  transferPaid,
  transferUnpaid,
  handleToggleGroupStatus,
  handleOpenGroupSettingsModal,
  handleArchiveGroup,
  handleExportOrdersCSV,
  handleCopyUnpaidReminder,
  handleOpenPrintModal,
  handleOpenManualOrderModal,
}: AdminDashboardMetricsProps) {
  const isClosed = groupOrder?.status === 'closed';

  return (
    <div className="space-y-4">
      {/* 多活動快速切換頁籤 (若有複數進行中活動) */}
      {activeGroups.length > 1 && onSelectActiveGroup && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectActiveGroup('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
              selectedActiveGroupId === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            全部活動總覽 ({activeGroups.length})
          </button>
          {activeGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectActiveGroup(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                selectedActiveGroupId === g.id
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {/* 團購活動控制頂部橫幅 */}
      {groupOrder && (
        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {groupOrder.title}
                </h2>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    isClosed
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                  }`}
                >
                  {isClosed ? '🔒 已截單 (停止收單)' : '🟢 開放收單中'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                合作店家：{groupOrder.stores?.name || '未指定'}
              </p>
            </div>

            {/* 功能快捷按鈕組 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleToggleGroupStatus(isClosed ? 'open' : 'closed')}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer ${
                  isClosed
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                }`}
              >
                {isClosed ? '🟢 重新開放收單' : '🔒 截單 (停止收單)'}
              </button>

              {handleOpenGroupSettingsModal && (
                <button
                  type="button"
                  onClick={handleOpenGroupSettingsModal}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer"
                >
                  ⚙️ 活動設定
                </button>
              )}

              <button
                type="button"
                onClick={handleArchiveGroup}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-xs transition active:scale-95 cursor-pointer"
              >
                📦 結單歸檔
              </button>
            </div>
          </div>

          {/* 快捷工具條 (報表、匯出、列印、代點) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenManualOrderModal}
              className="bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕ 幫朋友代點</span>
            </button>
            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-3 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️ 友善列印</span>
            </button>
            <button
              type="button"
              onClick={handleExportOrdersCSV}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-3 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊 匯出 CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopyUnpaidReminder}
              className="bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 font-extrabold text-xs px-3 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>📢 催繳文字 ({unpaidSubmissionsCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* 總營收與對帳指標卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500">💰 全團總金額</span>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">${grandTotal}</p>
          <span className="text-[10px] text-slate-400 font-bold block">共 {submissionsCount} 筆訂單</span>
        </div>

        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">✅ 已收款總額</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">${paidTotal}</p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold block">
            {grandTotal > 0 ? Math.round((paidTotal / grandTotal) * 100) : 0}% 已入帳
          </span>
        </div>

        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">⏳ 待收餘額</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">${grandTotal - paidTotal}</p>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 font-bold block">
            剩餘 {unpaidSubmissionsCount} 人未付款
          </span>
        </div>

        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400">🍔 餐點總份數</span>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400 tracking-tight">{totalItemCount} 份</p>
          <span className="text-[10px] text-slate-400 font-bold block">實用下單基準</span>
        </div>
      </div>

      {/* 金流分類收費卡片 (現金 / LINE Pay / 銀行轉帳) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
              💵 現金收款
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
              已收 ${cashPaid} / 待收 <span className="text-rose-500 font-bold">${cashUnpaid}</span>
            </p>
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">${cashPaid + cashUnpaid}</span>
        </div>

        <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              🟢 LINE Pay
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
              已收 ${linePayPaid} / 待收 <span className="text-rose-500 font-bold">${linePayUnpaid}</span>
            </p>
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">${linePayPaid + linePayUnpaid}</span>
        </div>

        <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-sky-600 dark:text-sky-400 flex items-center gap-1">
              🏦 銀行轉帳
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
              已收 ${transferPaid} / 待收 <span className="text-rose-500 font-bold">${transferUnpaid}</span>
            </p>
          </div>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100">${transferPaid + transferUnpaid}</span>
        </div>
      </div>
    </div>
  );
}
