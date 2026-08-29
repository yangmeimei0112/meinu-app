'use client';

import React from 'react';
import { History as IconHistory, Check as IconCheck, AlertCircle as IconAlertCircle } from 'lucide-react';
import type { ValidatedDraft } from './useCustomModalDraft';

interface CustomModalDraftBannerProps {
  detectedDraft: ValidatedDraft | null;
  restoredToast: boolean;
  errorMsg: string | null;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
}

export function CustomModalDraftBanner({
  detectedDraft,
  restoredToast,
  errorMsg,
  onRestoreDraft,
  onDiscardDraft,
}: CustomModalDraftBannerProps) {
  return (
    <>
      {/* 📋 草稿恢復提示條 */}
      {detectedDraft && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200 gap-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
              <IconHistory className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>偵測到上次選到一半的草稿</span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 truncate font-medium max-w-[210px] sm:max-w-[240px]">
              {detectedDraft.summaryText}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRestoreDraft}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
            >
              恢復選擇
            </button>
            <button
              type="button"
              onClick={onDiscardDraft}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] font-bold px-1.5 py-1 transition cursor-pointer"
            >
              捨棄
            </button>
          </div>
        </div>
      )}

      {/* ✅ 草稿恢復成功提示 */}
      {restoredToast && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900/60 px-4 py-2 flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold animate-in fade-in duration-150">
          <IconCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>已成功為您恢復上次選取的客製化草稿！</span>
        </div>
      )}

      {/* ⚠️ 錯誤警告 */}
      {errorMsg && (
        <div className="mx-4 mt-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-center gap-1.5 animate-shake">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </>
  );
}
