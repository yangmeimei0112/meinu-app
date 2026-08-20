'use client';

import React from 'react';
import { OrderSubmissionAdmin } from '../../admin-types';

interface AdminDashboardFeeSplitProps {
  totalItemCount: number;
  itemSummary: Record<string, number>;
  handleCopyStoreOrderText: () => void;
  submissions: OrderSubmissionAdmin[];
  inputDeliveryFee: number;
  inputDiscount: number;
  roundingRule: 'floor' | 'ceil' | 'round';
  setInputDeliveryFee: (value: number) => void;
  setInputDiscount: (value: number) => void;
  setRoundingRule: (value: 'floor' | 'ceil' | 'round') => void;
  calculateAdjustedAmount: (baseAmount: number) => number;
  handleApplyFeeSplit: () => void;
}

export function AdminDashboardFeeSplit({
  totalItemCount,
  itemSummary,
  handleCopyStoreOrderText,
  submissions,
  inputDeliveryFee,
  inputDiscount,
  roundingRule,
  setInputDeliveryFee,
  setInputDiscount,
  setRoundingRule,
  calculateAdjustedAmount,
  handleApplyFeeSplit,
}: AdminDashboardFeeSplitProps) {
  return (
    <div className="space-y-4">
      {/* 1. 向店家報單彙總清單組件 */}
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>📦 向店家下單總表</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/60">
                共 {totalItemCount} 份
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">向店家電話/LINE 叫餐報單專用清單</p>
          </div>

          <button
            type="button"
            onClick={handleCopyStoreOrderText}
            className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-100 dark:border-slate-700 transition active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>📋 複製報單文字</span>
          </button>
        </div>

        <div className="space-y-1.5 divide-y divide-slate-50 dark:divide-slate-800 max-h-[360px] overflow-y-auto pr-1">
          {Object.entries(itemSummary).map(([itemName, qty], idx) => (
            <div key={itemName} className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 pt-2">
              <div className="flex items-center gap-2 truncate mr-2">
                <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">{idx + 1}.</span>
                <span className="truncate">{itemName}</span>
              </div>
              <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black px-2.5 py-0.5 rounded-lg shrink-0 text-xs border border-transparent dark:border-sky-800/50">
                x {qty}
              </span>
            </div>
          ))}
          {Object.keys(itemSummary).length === 0 && (
            <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">目前尚無點餐資料</p>
          )}
        </div>
      </div>

      {/* 2. 運費平攤算式設定組件 */}
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>🔢 運費與折扣平攤設定</span>
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">即時試算每人金額</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="split-delivery-fee" className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block mb-1">外送費 (+)</label>
            <input
              id="split-delivery-fee"
              name="deliveryFee"
              type="number"
              value={inputDeliveryFee}
              onChange={(e) => setInputDeliveryFee(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label htmlFor="split-discount" className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block mb-1">折扣 (-)</label>
            <input
              id="split-discount"
              name="discount"
              type="number"
              value={inputDiscount}
              onChange={(e) => setInputDiscount(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
          <div>
            <label htmlFor="split-rounding-rule" className="text-[10px] text-slate-400 dark:text-slate-400 font-bold block mb-1">取整規則</label>
            <select
              id="split-rounding-rule"
              name="roundingRule"
              value={roundingRule}
              onChange={(e) => setRoundingRule(e.target.value as 'floor' | 'ceil' | 'round')}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="floor">無條件捨去</option>
              <option value="ceil">無條件進位</option>
              <option value="round">四捨五入</option>
            </select>
          </div>
        </div>

        {submissions.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-1.5">
            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
              試算對比預覽 (每人差額: ${calculateAdjustedAmount(0)} 元)
            </p>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              {submissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="py-1 flex justify-between font-semibold">
                  <span className="text-slate-700 dark:text-slate-200 truncate mr-2">{sub.user_nickname}</span>
                  <span className="text-slate-500 dark:text-slate-400 shrink-0">
                    原價 ${sub.total_amount} ➔{' '}
                    <span className="text-sky-600 dark:text-sky-400 font-extrabold">
                      ${calculateAdjustedAmount(sub.total_amount)} 元
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleApplyFeeSplit}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-95 cursor-pointer"
        >
          套用平攤算式並更新全團應收金額
        </button>
      </div>
    </div>
  );
}
