'use client';

import React from 'react';
import { OrderSubmissionAdmin } from '../admin-types';

interface AdminOrderCardProps {
  sub: OrderSubmissionAdmin;
  isChecked: boolean;
  onToggleSelect: (id: string, checked: boolean) => void;
  onTogglePaid: (id: string, currentPaid: boolean) => void;
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
  onSetSignatureTarget,
  onSetChangeModalTarget,
  onCopyPersonalReceipt,
  onDeleteOrder,
}: AdminOrderCardProps) {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700">
      {/* 頂部姓名、單號與付款切換 */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
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
            className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 cursor-pointer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base truncate">
                {sub.user_nickname}
              </h4>
              {sub.store_name && (
                <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-sky-100 dark:border-sky-900/60">
                  {sub.store_name}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
              #{sub.order_number} • {sub.payment_method_name}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onTogglePaid(sub.id, sub.is_paid)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer ${
            sub.is_paid
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 border border-transparent dark:border-emerald-800/60'
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/80 border border-transparent dark:border-amber-800/60 animate-pulse'
          }`}
        >
          {sub.is_paid ? '✅ 已付款' : '⏳ 待付款'}
        </button>
      </div>

      {/* 餐點明細 */}
      <div className="space-y-1">
        {(sub.order_items || []).map((item) => (
          <div
            key={item.id}
            className="text-xs flex items-start justify-between text-slate-600 dark:text-slate-300 font-medium"
          >
            <div>
              <span>
                • {item.item_name} x {item.quantity}
              </span>
              {item.custom_notes && (
                <p className="text-[10px] text-slate-400 dark:text-slate-400 pl-2">{item.custom_notes}</p>
              )}
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
              ${item.unit_price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* 缺貨備案提示 */}
      {sub.sold_out_option && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#182234] px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700">
          <span className="font-bold text-slate-700 dark:text-slate-200">缺貨處理：</span>
          {sub.sold_out_option}
        </div>
      )}

      {/* 數位簽名預覽 */}
      {sub.signature_data && (
        <div className="bg-slate-50 dark:bg-[#182234] p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 shrink-0">核實簽名:</span>
          <img src={sub.signature_data} alt="簽名" className="h-6 object-contain" />
        </div>
      )}

      {/* 底部功能捷徑與總額 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onSetSignatureTarget(sub)}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-transparent dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            ✍️ 簽名
          </button>
          <button
            type="button"
            onClick={() =>
              onSetChangeModalTarget({
                nickname: sub.user_nickname,
                amount: sub.final_amount,
              })
            }
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-transparent dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            💵 找零試算
          </button>
          <button
            type="button"
            onClick={() => onCopyPersonalReceipt(sub)}
            className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-sky-100 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            📋 私訊催款
          </button>
          <button
            type="button"
            onClick={() => onDeleteOrder(sub.id, sub.user_nickname, sub.order_number)}
            className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-rose-100 dark:border-rose-900/60 transition active:scale-95 cursor-pointer"
          >
            🗑️ 刪除
          </button>
        </div>

        <span className="text-sky-600 dark:text-sky-400 text-base font-extrabold">${sub.final_amount} 元</span>
      </div>
    </div>
  );
}
