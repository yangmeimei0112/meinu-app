'use client';

import React from 'react';
import { GroupOrderAdmin } from '../../admin-types';
import {
  Lock,
  CheckCircle2,
  Store as StoreIcon,
  Settings,
  Archive,
  Plus,
  Printer,
  Download,
  Megaphone,
} from 'lucide-react';
import { AdminDashboardStatCards } from './AdminDashboardStatCards';
import { AdminDashboardPaymentBreakdown } from './AdminDashboardPaymentBreakdown';

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

export function AdminDashboardMetrics({
  groupOrder,
  activeGroups = [],
  selectedActiveGroupId,
  onSelectActiveGroup,
  grandTotal,
  paidTotal,
  submissionsCount,
  totalItemCount,
  unpaidSubmissionsCount,
  paymentBreakdown,
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
      {/* 👑 主活動狀態橫幅與核心操作條 (Commander Header) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-white dark:from-sky-950/40 dark:via-[#0D182E] dark:to-[#0B1322] rounded-3xl p-5 sm:p-6 border border-sky-200/90 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(14,165,233,0.12)] space-y-4 backdrop-blur-md">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-blue-600" />

        {/* 🏬 店家分流快速切換標籤 (Tab Selector) - 始終保留【全部店家總覽】 */}
        {onSelectActiveGroup && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pl-2 scrollbar-none">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-400 shrink-0">店家分流：</span>
            {/* 🌟 第一個頁籤：全部店家 (所有送出訂單) */}
            <button
              type="button"
              onClick={() => onSelectActiveGroup('all')}
              className={`text-xs px-3.5 py-1.5 rounded-2xl font-black transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                selectedActiveGroupId === 'all' || !selectedActiveGroupId
                  ? 'bg-sky-500 text-white border-sky-500 shadow-xs ring-2 ring-sky-500/30'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🌟 全部店家 (所有訂單)</span>
            </button>

            {/* 各店家獨立分流標籤 */}
            {activeGroups.map((g) => {
              const isSelected = selectedActiveGroupId === g.id;
              const isStorePaused = g.status === 'closed' || (g.stores as any)?.is_accepting_orders === false;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectActiveGroup(g.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-2xl font-black transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs ring-2 ring-sky-500/30'
                      : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>{g.stores?.name || g.title}</span>
                  {g.stores?.code && (
                    <span className="text-[10px] font-mono opacity-80">#{g.stores.code}</span>
                  )}
                  {isStorePaused ? (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-800">
                      暫停
                    </span>
                  ) : (
                    (g.order_count ?? 0) > 0 && (
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-extrabold">
                        {g.order_count} 單
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
          {/* 左側：活動標題與店家資訊 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800/60 flex items-center gap-1">
                <StoreIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>
                  {selectedActiveGroupId === 'all' || !selectedActiveGroupId
                    ? '全站所有店家'
                    : groupOrder?.stores?.name || groupOrder?.title || '店家餐點'}
                </span>
              </span>

              {/* 狀態標籤 */}
              {selectedActiveGroupId === 'all' || !selectedActiveGroupId ? (
                <span className="inline-flex items-center gap-1 bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full text-xs font-black border border-sky-200 dark:border-sky-800/60">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                  <span>全站訂單即時中樞</span>
                </span>
              ) : isClosed ? (
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-black border border-amber-200 dark:border-amber-800/60">
                  <Lock className="w-3.5 h-3.5" />
                  <span>暫停接單中</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-black border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>營業接單中</span>
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {selectedActiveGroupId === 'all' || !selectedActiveGroupId
                ? '🌟 全站即時訂單總覽'
                : groupOrder?.title || '即時訂單管理'}
            </h2>

            {groupOrder?.announcement && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-1 pt-0.5">
                <Megaphone className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>{groupOrder.announcement}</span>
              </p>
            )}
          </div>

          {/* 右側：主操作按鈕群 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 開關接單按鈕 (個別店家視圖呈現) */}
            {selectedActiveGroupId !== 'all' && Boolean(selectedActiveGroupId) && (
              <button
                type="button"
                onClick={() => handleToggleGroupStatus(isClosed ? 'open' : 'closed')}
                className={`text-xs sm:text-sm px-4 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
                  isClosed
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isClosed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>開啟接單</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>暫停接單</span>
                  </>
                )}
              </button>
            )}

            {/* 店家即時營運設定 (公告/免運/倒數/補貼) */}
            {handleOpenGroupSettingsModal && selectedActiveGroupId !== 'all' && Boolean(selectedActiveGroupId) && (
              <button
                type="button"
                onClick={handleOpenGroupSettingsModal}
                className="bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                title="即時營運設定"
              >
                <Settings className="w-4 h-4 text-sky-500" />
                <span>店家設定</span>
              </button>
            )}

            {/* 📦 一鍵歸檔此店訂單 */}
            {selectedActiveGroupId !== 'all' && Boolean(selectedActiveGroupId) && (
              <button
                type="button"
                onClick={handleArchiveGroup}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                title="一鍵歸檔此店訂單"
              >
                <Archive className="w-4 h-4" />
                <span>一鍵歸檔此店</span>
              </button>
            )}

            {/* 手工補單 */}
            <button
              type="button"
              onClick={handleOpenManualOrderModal}
              className="bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl font-black transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="管理員替離線成員手動補登點餐"
            >
              <Plus className="w-4 h-4" />
              <span>手工補單</span>
            </button>

            {/* 友善列印 */}
            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 p-2.5 rounded-2xl transition active:scale-95 cursor-pointer shadow-2xs"
              title="列印廚房對帳單與大字標籤"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* 匯出 CSV */}
            <button
              type="button"
              onClick={handleExportOrdersCSV}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 p-2.5 rounded-2xl transition active:scale-95 cursor-pointer shadow-2xs"
              title="匯出訂單 CSV 試算表"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* 結案歸檔 */}
            <button
              type="button"
              onClick={handleArchiveGroup}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl font-black transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1.5"
              title="全體完成收款後，封存此活動進入歷史紀錄"
            >
              <Archive className="w-4 h-4" />
              <span>結案歸檔</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 1. 4 大核心統計指標卡片 */}
      <AdminDashboardStatCards
        grandTotal={grandTotal}
        paidTotal={paidTotal}
        submissionsCount={submissionsCount}
        totalItemCount={totalItemCount}
        unpaidSubmissionsCount={unpaidSubmissionsCount}
        onCopyUnpaidReminder={handleCopyUnpaidReminder}
      />

      {/* 💳 2. 付款方式即時對帳卡片 */}
      <AdminDashboardPaymentBreakdown
        paymentBreakdown={paymentBreakdown}
        cashPaid={cashPaid}
        cashUnpaid={cashUnpaid}
        linePayPaid={linePayPaid}
        linePayUnpaid={linePayUnpaid}
        transferPaid={transferPaid}
        transferUnpaid={transferUnpaid}
      />
    </div>
  );
}
