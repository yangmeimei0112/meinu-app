'use client';

import React from 'react';
import { GroupOrderAdmin, OrderSubmissionAdmin } from '../../admin-types';
import {
  Check,
  Store as StoreIcon,
  Package,
  Megaphone,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface AdminArchiveCardProps {
  group: GroupOrderAdmin;
  isChecked: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  orders: OrderSubmissionAdmin[];
  isLoadingOrders: boolean;
  onToggleSelectItem: (id: string, e?: React.MouseEvent) => void;
  onToggleExpandOrders: (groupId: string, e?: React.MouseEvent) => void;
  onReopenGroup: (group: GroupOrderAdmin) => void;
  onDeleteGroup: (groupId: string, title: string) => void;
}

export function AdminArchiveCard({
  group,
  isChecked,
  isExpanded,
  isSelected,
  orders,
  isLoadingOrders,
  onToggleSelectItem,
  onToggleExpandOrders,
  onReopenGroup,
  onDeleteGroup,
}: AdminArchiveCardProps) {
  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + o.final_amount, 0);
  const paidCount = orders.filter((o) => o.is_paid).length;

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md ${
        isChecked
          ? 'border-sky-400 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-300 dark:ring-sky-700/60'
          : isSelected
          ? 'border-sky-300 dark:border-sky-500 bg-white/95 dark:bg-[#0E1726]/95'
          : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0E1726]/95 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* 歷史團購活動卡片頭部資訊 */}
      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {/* 核取方塊 */}
            <button
              type="button"
              aria-label={`選取歷史活動 ${group.title}`}
              onClick={(e) => onToggleSelectItem(group.id, e)}
              className={`w-5 h-5 mt-1 rounded-lg border flex items-center justify-center text-[10px] font-black transition shrink-0 cursor-pointer ${
                isChecked
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-sky-400'
              }`}
            >
              {isChecked && <Check className="w-3 h-3 text-white" />}
            </button>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 店家標籤 */}
                <span className="text-[11px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 px-3 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 flex items-center gap-1">
                  <StoreIcon className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                  <span>{group.stores?.name || '合作門市'}</span>
                </span>

                {/* 狀態標籤 */}
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <Package className="w-3 h-3 text-slate-400" />
                  <span>已結案歸檔</span>
                </span>
              </div>

              {/* 活動標題 */}
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {group.title}
              </h4>

              {/* 公告 */}
              {group.announcement && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic flex items-center gap-1">
                  <Megaphone className="w-3 h-3 text-sky-500 shrink-0" />
                  <span>{group.announcement}</span>
                </p>
              )}
            </div>
          </div>

          {/* 操作功能按鈕群 */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* 重開此團 */}
            <button
              type="button"
              onClick={() => onReopenGroup(group)}
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-black px-3.5 py-2 rounded-2xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="複製本活動重新發起開團"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">以此重開</span>
            </button>

            {/* 單筆刪除 */}
            <button
              type="button"
              aria-label={`刪除歷史活動 ${group.title}`}
              onClick={() => onDeleteGroup(group.id, group.title)}
              className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition active:scale-95 cursor-pointer shadow-2xs"
              title="刪除此筆歷史紀錄"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 底部摘要與訂單展開折疊列 */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
            歸檔時間：{formatDateTime(group.created_at)}
          </div>

          <button
            type="button"
            onClick={(e) => onToggleExpandOrders(group.id, e)}
            className="text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>{isExpanded ? '收合訂單紀錄' : '展開查看歷史訂單'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 展開之歷史訂單清單 */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-5 space-y-4 animate-in fade-in duration-150">
          {isLoadingOrders ? (
            <div className="text-center py-6 text-slate-400 text-xs animate-pulse">
              正在讀取歷史訂單資料...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              此歷史活動無訂單紀錄
            </div>
          ) : (
            <>
              {/* 統計摘要條 */}
              <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">總訂單數</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100">{totalOrders} 筆</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">總金額</span>
                  <span className="text-sm font-black text-sky-600 dark:text-sky-400">${totalSales}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">付款完成率</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {totalOrders > 0 ? `${Math.round((paidCount / totalOrders) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* 訂單明細條列表 */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        #{order.order_number} {order.user_nickname}
                      </span>
                      <span className="font-black text-sky-600 dark:text-sky-400">
                        ${order.final_amount}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {order.order_items.map((i) => `${i.item_name} x${i.quantity}`).join('、')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
