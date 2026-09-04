'use client';

import React, { useState, useEffect } from 'react';
import { Store } from '@/types/database';
import { X, Save, Sparkles } from 'lucide-react';
import { StoreOperationFormFields } from './store-operation/StoreOperationFormFields';
import { formatErrorMessage } from '@/lib/errorUtils';

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
      setModalError(formatErrorMessage(err, '儲存營運設定失敗，請稍後再試！'));
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
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                店家即時營運設定
              </h3>
              <p className="text-xs text-slate-400">
                店家：<span className="font-bold text-slate-700 dark:text-slate-200">{targetStore.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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

          {/* 各設定欄位組件 */}
          <StoreOperationFormFields
            isAcceptingOrders={isAcceptingOrders}
            setIsAcceptingOrders={setIsAcceptingOrders}
            announcement={announcement}
            setAnnouncement={setAnnouncement}
            enableMinThreshold={enableMinThreshold}
            setEnableMinThreshold={setEnableMinThreshold}
            minThresholdAmount={minThresholdAmount}
            setMinThresholdAmount={setMinThresholdAmount}
            enableCountdown={enableCountdown}
            setEnableCountdown={setEnableCountdown}
            cutoffTime={cutoffTime}
            setCutoffTime={setCutoffTime}
            enableBudgetLimit={enableBudgetLimit}
            setEnableBudgetLimit={setEnableBudgetLimit}
            budgetLimitAmount={budgetLimitAmount}
            setBudgetLimitAmount={setBudgetLimitAmount}
          />

          {/* 底部按鈕 */}
          <div className="pt-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-3 rounded-2xl transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-black py-3 rounded-2xl transition shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '儲存中...' : '儲存營運設定'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
