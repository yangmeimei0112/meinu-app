'use client';

import { useState, useEffect } from 'react';
import { GroupOrderAdmin } from './admin-types';
import { Store } from '@/types/database';

interface AdminGroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupOrder: GroupOrderAdmin | null;
  stores: Store[];
  onSaveGroupSettings: (updatedData: {
    title: string;
    store_id: string;
    announcement: string | null;
    enable_min_threshold: boolean;
    min_threshold_amount: number;
    enable_countdown: boolean;
    cutoff_time: string | null;
    enable_budget_limit: boolean;
    budget_limit_amount: number;
  }) => Promise<void>;
}

export default function AdminGroupSettingsModal({
  isOpen,
  onClose,
  groupOrder,
  stores,
  onSaveGroupSettings,
}: AdminGroupSettingsModalProps) {
  const [title, setTitle] = useState('');
  const [storeId, setStoreId] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [enableMinThreshold, setEnableMinThreshold] = useState(false);
  const [minThresholdAmount, setMinThresholdAmount] = useState(300);
  const [enableCountdown, setEnableCountdown] = useState(false);
  const [cutoffTime, setCutoffTime] = useState('');
  const [enableBudgetLimit, setEnableBudgetLimit] = useState(false);
  const [budgetLimitAmount, setBudgetLimitAmount] = useState(150);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (groupOrder) {
      setTitle(groupOrder.title || '');
      setStoreId(groupOrder.store_id || (stores[0]?.id ?? ''));
      setAnnouncement(groupOrder.announcement || '');
      setEnableMinThreshold(Boolean(groupOrder.enable_min_threshold));
      setMinThresholdAmount(groupOrder.min_threshold_amount || 300);
      setEnableCountdown(Boolean(groupOrder.enable_countdown));
      setCutoffTime(
        groupOrder.cutoff_time
          ? new Date(groupOrder.cutoff_time).toISOString().slice(0, 16)
          : ''
      );
      setEnableBudgetLimit(Boolean(groupOrder.enable_budget_limit));
      setBudgetLimitAmount(groupOrder.budget_limit_amount || 150);
    } else {
      setTitle('今日美味團購點餐');
      setStoreId(stores[0]?.id ?? '');
      setAnnouncement('');
      setEnableMinThreshold(false);
      setMinThresholdAmount(300);
      setEnableCountdown(false);
      setCutoffTime('');
      setEnableBudgetLimit(false);
      setBudgetLimitAmount(150);
    }
  }, [groupOrder, stores, isOpen]);

  const [modalError, setModalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!title.trim() || !storeId) {
      setModalError('⚠️ 請填寫團購活動名稱並選擇合作門市！');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveGroupSettings({
        title: title.trim(),
        store_id: storeId,
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
      console.error(err);
      setModalError(`❌ 儲存失敗：${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {groupOrder ? '團購活動與進階設定' : '🚀 發起全新團購活動'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                設定公告通知、湊單進度條、截單倒數與個人補助預算
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {modalError && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-300 text-xs font-bold p-3 rounded-2xl animate-in fade-in zoom-in-95 duration-150 shadow-xs">
              {modalError}
            </div>
          )}

          {/* 活動名稱 */}
          <div>
            <label htmlFor="group-modal-title" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              團購活動標題 <span className="text-rose-500">*</span>
            </label>
            <input
              id="group-modal-title"
              name="groupTitle"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：週五午餐 50嵐飲料揪團"
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
            />
          </div>

          {/* 合作門市選擇 */}
          <div>
            <label htmlFor="group-modal-store" className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              合作店家 / 門市 <span className="text-rose-500">*</span>
            </label>
            <select
              id="group-modal-store"
              name="groupStoreId"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code || 'S-001'}] {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 團長即時公告欄 */}
          <div className="bg-sky-50/60 dark:bg-sky-950/40 rounded-2xl p-3.5 border border-sky-100 dark:border-sky-900/60 space-y-1.5">
            <label htmlFor="group-modal-announcement" className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
              <span>📢 團長即時公告欄</span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">（前台頂部即時顯示彩色跑馬燈）</span>
            </label>
            <input
              id="group-modal-announcement"
              name="groupAnnouncement"
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="例如：團長已下單！預計 12:30 送達一樓大廳 / 記得自備零錢"
              className="w-full bg-white dark:bg-[#182234] border border-sky-200 dark:border-sky-800/60 rounded-xl p-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 湊單門檻進度條 */}
          <div className="bg-slate-50 dark:bg-[#182234] rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="group-modal-enable-min-threshold" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <span>🚚 起送 / 免運湊單進度條</span>
              </label>
              <input
                id="group-modal-enable-min-threshold"
                name="enableMinThreshold"
                aria-label="啟用起送/免運門檻進度條"
                type="checkbox"
                checked={enableMinThreshold}
                onChange={(e) => setEnableMinThreshold(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-400 cursor-pointer"
              />
            </div>
            {enableMinThreshold && (
              <div className="pt-1">
                <label htmlFor="group-modal-min-threshold" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                  起送/免運門檻金額 ($)：
                </label>
                <input
                  id="group-modal-min-threshold"
                  name="minThresholdAmount"
                  type="number"
                  min="1"
                  value={minThresholdAmount}
                  onChange={(e) => setMinThresholdAmount(Number(e.target.value))}
                  placeholder="例如：300"
                  className="w-full bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            )}
          </div>

          {/* 截單倒數計時器 */}
          <div className="bg-slate-50 dark:bg-[#182234] rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="group-modal-enable-countdown" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <span>⏱️ 預計截單倒數計時器</span>
              </label>
              <input
                id="group-modal-enable-countdown"
                name="enableCountdown"
                aria-label="啟用截單倒數計時器"
                type="checkbox"
                checked={enableCountdown}
                onChange={(e) => setEnableCountdown(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-400 cursor-pointer"
              />
            </div>
            {enableCountdown && (
              <div className="pt-1">
                <label htmlFor="group-modal-cutoff-time" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                  預計截止時間：
                </label>
                <input
                  id="group-modal-cutoff-time"
                  name="cutoffTime"
                  type="datetime-local"
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="w-full bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            )}
          </div>

          {/* 個人消費/公費補助上限 */}
          <div className="bg-slate-50 dark:bg-[#182234] rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="group-modal-enable-budget" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <span>💵 每人預算上限 / 公費補貼提醒</span>
              </label>
              <input
                id="group-modal-enable-budget"
                name="enableBudgetLimit"
                aria-label="啟用每人預算上限/公費補貼提醒"
                type="checkbox"
                checked={enableBudgetLimit}
                onChange={(e) => setEnableBudgetLimit(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-400 cursor-pointer"
              />
            </div>
            {enableBudgetLimit && (
              <div className="pt-1">
                <label htmlFor="group-modal-budget-limit" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                  每人補助/預算上限金額 ($)：
                </label>
                <input
                  id="group-modal-budget-limit"
                  name="budgetLimitAmount"
                  type="number"
                  min="1"
                  value={budgetLimitAmount}
                  onChange={(e) => setBudgetLimitAmount(Number(e.target.value))}
                  placeholder="例如：150"
                  className="w-full bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            )}
          </div>

          {/* 底部儲存與取消按鈕 */}
          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-2xl transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-extrabold py-2.5 rounded-2xl transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? '儲存中...' : '💾 儲存團購設定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
