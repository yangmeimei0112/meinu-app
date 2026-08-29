'use client';

import React from 'react';
import { MaintenanceData } from '@/components/MaintenanceGuard';
import { Settings, X, Lightbulb, Upload, Save } from 'lucide-react';

const QUICK_REASONS = [
  '系統例行升級',
  '菜單規格重整',
  '效能優化更新',
  '金流維護升級',
  '資料庫同步維護',
];

interface AdminMaintenanceFormProps {
  config: MaintenanceData;
  setConfig: React.Dispatch<React.SetStateAction<MaintenanceData>>;
  saving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSaveConfig: (overrideState?: boolean) => Promise<void>;
}

export function AdminMaintenanceForm({
  config,
  setConfig,
  saving,
  fileInputRef,
  onImageUpload,
  onRemoveImage,
  onSaveConfig,
}: AdminMaintenanceFormProps) {
  return (
    <div className="space-y-4">
      {/* 1. 主開關卡片 */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">維護模式總開關</span>
            <span className="text-[11px] text-slate-400">
              開啟後全站將顯示維護全螢幕，所有使用者皆無法送單
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_maintenance}
              onChange={(e) => {
                const nextState = e.target.checked;
                setConfig((prev) => ({ ...prev, is_maintenance: nextState }));
                onSaveConfig(nextState);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500" />
          </label>
        </div>
      </div>

      {/* 2. 快速套用維護事由 */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>常用維護事由快捷按鈕</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  reason: r,
                  title: `網站${r}中，請稍後再下單`,
                }))
              }
              className={`text-[11px] px-2.5 py-1 rounded-xl font-bold border transition active:scale-95 cursor-pointer ${
                config.reason === r
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 維護標題 */}
      <div className="space-y-1">
        <label htmlFor="maint-title-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          維護大標題
        </label>
        <input
          id="maint-title-input"
          name="maintTitle"
          type="text"
          value={config.title}
          onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="例如：網站例行升級中..."
        />
      </div>

      {/* 4. 維護詳細說明 */}
      <div className="space-y-1">
        <label htmlFor="maint-message-textarea" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          維護廣播說明文字
        </label>
        <textarea
          id="maint-message-textarea"
          name="maintMessage"
          rows={3}
          value={config.message}
          onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
          className="w-full bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="請輸入欲向點餐成員說明的維護原因或注意事項..."
        />
      </div>

      {/* 5. 預計完成時間 */}
      <div className="space-y-1">
        <label htmlFor="maint-time-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          預計完成時間
        </label>
        <input
          id="maint-time-input"
          name="maintEstimatedTime"
          type="text"
          value={config.estimated_end_time || ''}
          onChange={(e) => setConfig((prev) => ({ ...prev, estimated_end_time: e.target.value }))}
          className="w-full bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="例如：預計 12:30 恢復點餐 或 預計 15 分鐘完成"
        />
      </div>

      {/* 6. 自訂圖片 / GIF 上傳 */}
      <div className="space-y-1.5 pt-1">
        <label htmlFor="maint-image-file-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-sky-500" />
          <span>自訂維護插圖 / 動態 GIF (選填)</span>
        </label>

        {config.custom_image_url ? (
          <div className="relative inline-block border-2 border-amber-400 dark:border-amber-500 rounded-2xl overflow-hidden shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.custom_image_url}
              alt="維護自訂圖片"
              className="w-36 h-36 object-contain bg-slate-900"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition cursor-pointer"
              title="移除自訂圖片"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <input
              id="maint-image-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400 active:scale-95 transition shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-sky-500" />
              <span>上傳圖片 / GIF（支援 3MB 內）</span>
            </button>
          </div>
        )}
      </div>

      {/* 儲存設定按鈕 */}
      <div className="pt-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSaveConfig()}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? '正在儲存設定中...' : '儲存維護設定'}</span>
        </button>
      </div>
    </div>
  );
}
