'use client';

import React from 'react';
import {
  Megaphone,
  Truck,
  Clock,
  Banknote,
  CheckCircle2,
  PauseCircle,
} from 'lucide-react';

interface StoreOperationFormFieldsProps {
  isAcceptingOrders: boolean;
  setIsAcceptingOrders: (val: boolean) => void;
  announcement: string;
  setAnnouncement: (val: string) => void;
  enableMinThreshold: boolean;
  setEnableMinThreshold: (val: boolean) => void;
  minThresholdAmount: number;
  setMinThresholdAmount: (val: number) => void;
  enableCountdown: boolean;
  setEnableCountdown: (val: boolean) => void;
  cutoffTime: string;
  setCutoffTime: (val: string) => void;
  enableBudgetLimit: boolean;
  setEnableBudgetLimit: (val: boolean) => void;
  budgetLimitAmount: number;
  setBudgetLimitAmount: (val: number) => void;
}

export function StoreOperationFormFields({
  isAcceptingOrders,
  setIsAcceptingOrders,
  announcement,
  setAnnouncement,
  enableMinThreshold,
  setEnableMinThreshold,
  minThresholdAmount,
  setMinThresholdAmount,
  enableCountdown,
  setEnableCountdown,
  cutoffTime,
  setCutoffTime,
  enableBudgetLimit,
  setEnableBudgetLimit,
  budgetLimitAmount,
  setBudgetLimitAmount,
}: StoreOperationFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* 🟢 接單開關 Toggle */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAcceptingOrders ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <PauseCircle className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                {isAcceptingOrders ? '營業接單中' : '暫停接單中'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAcceptingOrders
                  ? '前台正常顯示，顧客可直接加入購物車並結帳送單'
                  : '前台自動沉底並反灰標註，顧客仍可瀏覽與加入購物車但無法結帳送單'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isAcceptingOrders}
              onChange={(e) => setIsAcceptingOrders(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* 📢 即時公告欄 */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5 text-sky-500" />
          <span>店家即時公告欄</span>
        </label>
        <input
          type="text"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="例如：今日紅茶已售完、預計 11:30 統一外送..."
          className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* 🚚 免運/起送目標進度條 */}
      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
            <Truck className="w-3.5 h-3.5 text-sky-500" />
            <span>開啟起送／免運目標進度條</span>
          </label>
          <input
            type="checkbox"
            checked={enableMinThreshold}
            onChange={(e) => setEnableMinThreshold(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
        </div>
        {enableMinThreshold && (
          <div className="pt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">目標金額：$</span>
            <input
              type="number"
              min="1"
              value={minThresholdAmount}
              onChange={(e) => setMinThresholdAmount(Number(e.target.value))}
              className="w-28 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">元</span>
          </div>
        )}
      </div>

      {/* ⏱️ 截單倒數計時器 */}
      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>開啟截單倒數計時器 (時間到自動暫停接單)</span>
          </label>
          <input
            type="checkbox"
            checked={enableCountdown}
            onChange={(e) => setEnableCountdown(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
        </div>
        {enableCountdown && (
          <div className="pt-2">
            <input
              type="datetime-local"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="w-full bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}
      </div>

      {/* 💰 公費補助上限提示 */}
      <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
            <Banknote className="w-3.5 h-3.5 text-sky-500" />
            <span>開啟公費補助金額上限提示</span>
          </label>
          <input
            type="checkbox"
            checked={enableBudgetLimit}
            onChange={(e) => setEnableBudgetLimit(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
        </div>
        {enableBudgetLimit && (
          <div className="pt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">每人補助上限：$</span>
            <input
              type="number"
              min="1"
              value={budgetLimitAmount}
              onChange={(e) => setBudgetLimitAmount(Number(e.target.value))}
              className="w-28 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">元</span>
          </div>
        )}
      </div>
    </div>
  );
}
