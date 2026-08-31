'use client';

import React, { useState, useEffect } from 'react';
import { Store } from '@/types/database';
import {
  X,
  Megaphone,
  Truck,
  Clock,
  Banknote,
  Save,
  CheckCircle2,
  PauseCircle,
  Sparkles,
} from 'lucide-react';

interface AdminStoreOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStore: Store | null;
  onSaveStoreSettings: (storeId: string, updatedData: Partial<Store>) => Promise<void>;
}

export function AdminStoreOperationModal({
  isOpen,
  onClose,
  targetStore,
  onSaveStoreSettings,
}: AdminStoreOperationModalProps) {
  const [isAcceptingOrders, setIsAcceptingOrders] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>('');
  const [enableMinThreshold, setEnableMinThreshold] = useState<boolean>(false);
  const [minThresholdAmount, setMinThresholdAmount] = useState<number>(300);
  const [enableCountdown, setEnableCountdown] = useState<boolean>(false);
  const [cutoffTime, setCutoffTime] = useState<string>('');
  const [enableBudgetLimit, setEnableBudgetLimit] = useState<boolean>(false);
  const [budgetLimitAmount, setBudgetLimitAmount] = useState<number>(150);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (targetStore) {
      setIsAcceptingOrders(targetStore.is_accepting_orders !== false);
      setAnnouncement(targetStore.announcement || '');
      setEnableMinThreshold(Boolean(targetStore.enable_min_threshold));
      setMinThresholdAmount(targetStore.min_threshold_amount || 300);
      setEnableCountdown(Boolean(targetStore.enable_countdown));
      setCutoffTime(
        targetStore.cutoff_time
          ? new Date(targetStore.cutoff_time).toISOString().slice(0, 16)
          : ''
      );
      setEnableBudgetLimit(Boolean(targetStore.enable_budget_limit));
      setBudgetLimitAmount(targetStore.budget_limit_amount || 150);
    }
  }, [targetStore, isOpen]);

  if (!isOpen || !targetStore) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    try {
      setIsSaving(true);
      await onSaveStoreSettings(targetStore.id, {
        is_accepting_orders: isAcceptingOrders,
        announcement: announcement.trim() || null,
        enable_min_threshold: enableMinThreshold,
        min_threshold_amount: Number(minThresholdAmount) || 0,
        enable_countdown: enableCountdown,
        cutoff_time: enableCountdown && cutoffTime ? new Date(cutoffTime).toISOString() : null,
        enable_budget_limit: enableBudgetLimit,
        budget_limit_amount: Number(budgetLimitAmount) || 0,
      });
      onClose();
    } catch (err: any) {
      console.error('儲存店家即時營運設定失敗:', err);
      setModalError(`儲存失敗：${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
        {/* 頂部標題列 */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-800 dark:text-slate-100">
                {targetStore.name} · 即時營運設定
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                店家代碼：#{targetStore.code || 'S-001'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-2xl text-xs text-red-600 dark:text-red-400 font-bold">
              {modalError}
            </div>
          )}

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
                className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 border-slate-300 dark:border-slate-700"
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
                className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 border-slate-300 dark:border-slate-700"
              />
            </div>
            {enableCountdown && (
              <div className="pt-2">
                <input
                  type="datetime-local"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="w-full bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          {/* 🏢 每人公費預算補貼上限 */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <Banknote className="w-3.5 h-3.5 text-sky-500" />
                <span>開啟每人公費補助金額上限</span>
              </label>
              <input
                type="checkbox"
                checked={enableBudgetLimit}
                onChange={(e) => setEnableBudgetLimit(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500 border-slate-300 dark:border-slate-700"
              />
            </div>
            {enableBudgetLimit && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">補助上限：$</span>
                <input
                  type="number"
                  min="1"
                  value={budgetLimitAmount}
                  onChange={(e) => setBudgetLimitAmount(Number(e.target.value))}
                  className="w-28 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">元 / 每位成員</span>
              </div>
            )}
          </div>

          {/* 底部按鈕 */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? '儲存中...' : '儲存營運設定'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
