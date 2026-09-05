'use client';

import React, { useState } from 'react';
import { OrderSubmissionAdmin } from '../admin-types';
import {
  CheckCircle2,
  Clock,
  PenTool,
  Banknote,
  Copy,
  Trash2,
  ChefHat,
  ShoppingBag,
  XCircle,
  ChevronDown,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { PaymentMethodIcon, SoldOutOptionIcon, stripEmojis } from '@/lib/icon-utils';
import { OrderProgressStatus, ORDER_STATUS_META } from '@/types/orderStatus';

interface AdminOrderCardProps {
  sub: OrderSubmissionAdmin;
  isChecked: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  onTogglePaid: (id: string, currentPaid: boolean) => void;
  onUpdateProgressStatus?: (subId: string, newStatus: OrderProgressStatus) => void;
  onSetSignatureTarget: (sub: OrderSubmissionAdmin) => void;
  onSetChangeModalTarget: (target: { nickname: string; amount: number }) => void;
  onCopyPersonalReceipt: (sub: OrderSubmissionAdmin) => void;
  onDeleteOrder: (id: string, nickname: string, orderNumber: string) => void;
}

export default function AdminOrderCard({
  sub,
  isChecked,
  onToggleSelect,
  onTogglePaid,
  onUpdateProgressStatus,
  onSetSignatureTarget,
  onSetChangeModalTarget,
  onCopyPersonalReceipt,
  onDeleteOrder,
}: AdminOrderCardProps) {
  const isPaid = sub.is_paid;
  const currentProgress: OrderProgressStatus = sub.progress_status || 'pending';
  const progressMeta = ORDER_STATUS_META[currentProgress] || ORDER_STATUS_META.pending;
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const NEXT_STEP_MAP: Partial<Record<OrderProgressStatus, { next: OrderProgressStatus; label: string }>> = {
    pending: { next: 'confirmed', label: '接單確認' },
    confirmed: { next: 'preparing', label: '開始製作' },
    preparing: { next: 'ready', label: '通知取餐' },
    ready: { next: 'completed', label: '完成訂單' },
  };
  const nextStep = NEXT_STEP_MAP[currentProgress];

  const statusOptions: Array<{ key: OrderProgressStatus; label: string; icon: any; color: string }> = [
    { key: 'pending', label: '待確認', icon: Clock, color: 'text-amber-500' },
    { key: 'confirmed', label: '已確認', icon: ClipboardCheck, color: 'text-blue-500' },
    { key: 'preparing', label: '製作中', icon: ChefHat, color: 'text-sky-500' },
    { key: 'ready', label: '待取餐', icon: ShoppingBag, color: 'text-indigo-500' },
    { key: 'completed', label: '已完成', icon: CheckCircle2, color: 'text-emerald-500' },
    { key: 'cancelled', label: '已取消', icon: XCircle, color: 'text-rose-500' },
  ];

  return (
    <div
      className={`rounded-3xl p-4 sm:p-5 border transition-all duration-200 space-y-3.5 backdrop-blur-md ${
        currentProgress === 'cancelled'
          ? 'bg-slate-100/80 dark:bg-[#12151D]/90 border-slate-300/80 dark:border-slate-800 opacity-75'
          : isPaid
          ? 'bg-white/95 dark:bg-[#0E1726]/95 border-slate-200/80 dark:border-slate-800 border-l-4 border-l-emerald-500 dark:border-l-emerald-400 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:border-slate-300 dark:hover:border-slate-700'
          : 'bg-gradient-to-r from-rose-50/50 via-white/95 to-white dark:from-[#211219]/70 dark:via-[#140E1B]/95 dark:to-[#0E1726] border-rose-200/80 dark:border-rose-900/50 border-l-4 border-l-rose-500 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.08)] hover:border-rose-300 dark:hover:border-rose-800'
      }`}
    >
      {/* 頂部姓名、單號、店家標籤、進度狀態與付款狀態開關 */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <label htmlFor={`sub-select-${sub.id}`} className="sr-only">
            {`選取 ${sub.user_nickname} 的訂單`}
          </label>
          <input
            id={`sub-select-${sub.id}`}
            name={`sub_select_${sub.id}`}
            aria-label={`選取 ${sub.user_nickname} 的訂單`}
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onToggleSelect(sub.id, e.target.checked)}
            className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 cursor-pointer accent-sky-500"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-slate-900 dark:text-slate-100 text-base truncate">
                {sub.user_nickname}
              </h4>
              {sub.store_name && (
                <span className="bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-sky-200/80 dark:border-sky-800/60">
                  {sub.store_name}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 font-bold flex items-center gap-1.5">
              <span>#{sub.order_number}</span>
              <span>&bull;</span>
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <PaymentMethodIcon name={sub.payment_method_name} className="w-3 h-3 text-emerald-500" />
                <span>{stripEmojis(sub.payment_method_name)}</span>
              </span>
            </p>
          </div>
        </div>

        {/* 右側：訂單進度狀態切換器 + 付款狀態按鈕 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 🌟 訂單進度切換下拉選單 */}
          {onUpdateProgressStatus && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition active:scale-95 flex items-center gap-1.5 border shadow-2xs cursor-pointer ${progressMeta.badgeBg} ${progressMeta.badgeText} ${progressMeta.badgeBorder}`}
              >
                <span>進度: {progressMeta.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isStatusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStatusDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-xl min-w-[130px] space-y-1 animate-in zoom-in-95 duration-150">
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = currentProgress === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            onUpdateProgressStatus(sub.id, opt.key);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left text-xs font-black px-3 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 🌟 快捷進度推進按鈕 (pending -> confirmed -> preparing -> ready -> completed) */}
          {nextStep && onUpdateProgressStatus && (
            <button
              type="button"
              onClick={() => onUpdateProgressStatus(sub.id, nextStep.next)}
              className="px-2.5 py-1.5 rounded-full text-xs font-black transition active:scale-95 flex items-center gap-1 bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60 cursor-pointer shadow-2xs"
              title={`推進至「${ORDER_STATUS_META[nextStep.next]?.label || nextStep.next}」`}
            >
              <span>{nextStep.label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {/* 付款狀態切換按鈕 */}
          <button
            type="button"
            onClick={() => onTogglePaid(sub.id, sub.is_paid)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition active:scale-95 shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 ${
              isPaid
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/80'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 border border-rose-400 shadow-rose-500/25 animate-pulse'
            }`}
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>已付款</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>待付款 (點擊收款)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 餐點明細清單 */}
      <div className="space-y-1.5 pl-1">
        {(sub.order_items || []).map((item) => (
          <div
            key={item.id}
            className="text-xs flex items-start justify-between text-slate-700 dark:text-slate-200 font-semibold"
          >
            <div>
              <span className="font-bold">
                • {item.item_name} <span className="text-sky-600 dark:text-sky-400 font-black">x {item.quantity}</span>
              </span>
              {item.custom_notes && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-3 italic">
                  備註：{item.custom_notes}
                </p>
              )}
            </div>
            <span className="font-black text-slate-800 dark:text-slate-100 shrink-0 font-mono text-xs">
              ${item.unit_price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* 缺貨備案提示 */}
      {sub.sold_out_option && (
        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-amber-50/70 dark:bg-[#1E1710] px-3 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1.5">
          <SoldOutOptionIcon title={sub.sold_out_option} className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-black text-amber-800 dark:text-amber-400">缺貨備案：</span>
          <span>{stripEmojis(sub.sold_out_option)}</span>
        </div>
      )}

      {/* 數位手繪簽名預覽 */}
      {sub.signature_data && (
        <div className="bg-slate-50 dark:bg-[#152033] p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-sky-500" />
            <span>對帳簽名:</span>
          </span>
          <div className="bg-white rounded-xl px-3 py-1 border border-slate-200 shadow-2xs flex items-center justify-center max-w-[200px]">
            <img src={sub.signature_data} alt="對帳簽名" className="h-8 max-w-full object-contain" />
          </div>
        </div>
      )}

      {/* 底部操作按鈕與總計金額 */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onSetSignatureTarget(sub)}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-black px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <PenTool className="w-3 h-3" />
            <span>簽名</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onSetChangeModalTarget({
                nickname: sub.user_nickname,
                amount: sub.final_amount,
              })
            }
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-black px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Banknote className="w-3 h-3" />
            <span>找零試算</span>
          </button>
          <button
            type="button"
            onClick={() => onCopyPersonalReceipt(sub)}
            className="bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[11px] font-black px-2.5 py-1 rounded-xl border border-sky-200/80 dark:border-sky-800/60 transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>私訊明細</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteOrder(sub.id, sub.user_nickname, sub.order_number)}
            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-[11px] font-black px-2.5 py-1 rounded-xl border border-rose-200/60 dark:border-rose-900/60 transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>刪除</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 font-bold">應付</span>
          <span className="text-sky-600 dark:text-sky-400 text-lg font-black font-mono">
            ${sub.final_amount}
          </span>
          <span className="text-xs text-slate-400 font-bold">元</span>
        </div>
      </div>
    </div>
  );
}
