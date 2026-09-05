'use client';

import React from 'react';
import { OrderSubmissionAdmin } from '../../admin-types';
import { Package, Copy, Calculator, ArrowRight, Save } from 'lucide-react';

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
  const perPersonAdjustment = React.useMemo(() => {
    if (!submissions.length) return 0;
    const netAdjustment = inputDeliveryFee - inputDiscount;
    const perPersonShare = netAdjustment / submissions.length;

    let roundedShare = 0;
    if (roundingRule === 'floor') roundedShare = Math.floor(perPersonShare);
    else if (roundingRule === 'ceil') roundedShare = Math.ceil(perPersonShare);
    else roundedShare = Math.round(perPersonShare);

    return roundedShare;
  }, [submissions.length, inputDeliveryFee, inputDiscount, roundingRule]);

  return (
    <div className="space-y-5">
      {/* 1. 向店家報單彙總清單組件 (拿鐵暖橘調漸層) */}
      <div className="bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-white dark:from-[#21170E] dark:via-[#19120B] dark:to-[#100B07] rounded-3xl p-5 sm:p-6 border border-amber-200/80 dark:border-amber-500/30 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>向店家下單總表</span>
              <span className="text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                共 {totalItemCount} 份
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              向店家電話 / LINE 叫餐報單專用清單
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyStoreOrderText}
            className="bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-300 font-extrabold text-xs px-3.5 py-2 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>複製報單文字</span>
          </button>
        </div>

        <div className="space-y-1.5 divide-y divide-amber-100/60 dark:divide-slate-800 max-h-[340px] overflow-y-auto pr-1">
          {Object.entries(itemSummary).map(([itemName, qty], idx) => (
            <div
              key={itemName}
              className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 pt-2"
            >
              <div className="flex items-center gap-2 truncate mr-2">
                <span className="text-amber-600/70 dark:text-amber-500/70 font-mono text-[11px] font-black">
                  {idx + 1}.
                </span>
                <span className="truncate">{itemName}</span>
              </div>
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-black px-2.5 py-0.5 rounded-xl shrink-0 text-xs border border-amber-200/60 dark:border-amber-800/60 font-mono">
                x {qty}
              </span>
            </div>
          ))}
          {Object.keys(itemSummary).length === 0 && (
            <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">目前尚無點餐資料</p>
          )}
        </div>
      </div>

      {/* 2. 運費平攤算式設定組件 (科技紫藍調漸層) */}
      <div className="bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-white dark:from-[#181533] dark:via-[#131028] dark:to-[#0B0918] rounded-3xl p-5 sm:p-6 border border-indigo-200/80 dark:border-indigo-500/30 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm sm:text-base font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>運費與折扣平攤設定</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              依全團人數即時平均試算每人金額
            </p>
          </div>
          <span className="text-[11px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
            {submissions.length > 0
              ? perPersonAdjustment < 0
                ? `每人折抵 $${Math.abs(perPersonAdjustment)} 元`
                : `每人分攤 +${perPersonAdjustment} 元`
              : '尚無送單'}
          </span>
        </div>

        {/* 參數設定輸入區 */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label htmlFor="split-delivery-fee" className="text-[10px] text-indigo-900/80 dark:text-indigo-300 font-black block mb-1">
              外送費 (+)
            </label>
            <input
              id="split-delivery-fee"
              name="deliveryFee"
              type="number"
              value={inputDeliveryFee}
              onChange={(e) => setInputDeliveryFee(Number(e.target.value))}
              className="w-full bg-white dark:bg-[#110E24] border border-indigo-200 dark:border-indigo-900/80 rounded-2xl py-2 px-3 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs font-mono"
            />
          </div>
          <div>
            <label htmlFor="split-discount" className="text-[10px] text-indigo-900/80 dark:text-indigo-300 font-black block mb-1">
              滿額折扣 (-)
            </label>
            <input
              id="split-discount"
              name="discount"
              type="number"
              value={inputDiscount}
              onChange={(e) => setInputDiscount(Number(e.target.value))}
              className="w-full bg-white dark:bg-[#110E24] border border-indigo-200 dark:border-indigo-900/80 rounded-2xl py-2 px-3 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs font-mono"
            />
          </div>
          <div>
            <label htmlFor="split-rounding-rule" className="text-[10px] text-indigo-900/80 dark:text-indigo-300 font-black block mb-1">
              取整方式
            </label>
            <select
              id="split-rounding-rule"
              name="roundingRule"
              value={roundingRule}
              onChange={(e) => setRoundingRule(e.target.value as 'floor' | 'ceil' | 'round')}
              className="w-full bg-white dark:bg-[#110E24] border border-indigo-200 dark:border-indigo-900/80 rounded-2xl py-2 px-2 text-xs font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs cursor-pointer"
            >
              <option value="floor" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">無條件捨去</option>
              <option value="ceil" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">無條件進位</option>
              <option value="round" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">四捨五入</option>
            </select>
          </div>
        </div>

        {/* 即時試算預覽 */}
        {submissions.length > 0 && (
          <div className="bg-white/80 dark:bg-[#110E24]/80 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider">
              即時試算預覽 (全團 {submissions.length} 人，每人差額: {perPersonAdjustment < 0 ? `-$${Math.abs(perPersonAdjustment)}` : `+$${perPersonAdjustment}`} 元)
            </p>
            <div className="divide-y divide-indigo-50 dark:divide-indigo-950/80 text-xs">
              {submissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="py-1.5 flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-200 truncate mr-2">{sub.user_nickname}</span>
                  <span className="text-slate-400 dark:text-slate-500 shrink-0 font-mono text-[11px] flex items-center">
                    原價 ${sub.total_amount}
                    <ArrowRight className="w-3 h-3 mx-1 text-indigo-500 inline" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs">
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
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black py-2.5 rounded-2xl text-xs transition shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>套用平攤設定至全團訂單</span>
        </button>
      </div>
    </div>
  );
}
