'use client';

import React from 'react';
import { useTheme } from '@/lib/theme';
import { SingleMaintenanceGear } from './SingleMaintenanceGear';

export interface MaintenanceData {
  is_maintenance: boolean;
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  custom_image_url?: string;
  updated_at: string;
  build_id?: string;
}

function IconAlertTriangle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconClock({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

function IconSun({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

interface MaintenanceScreenProps {
  data: MaintenanceData;
  onCheckStatus?: () => void;
  checking?: boolean;
  checkMessage?: string | null;
  isPreview?: boolean;
}

// ----------------------------------------------------
// 🖼️ 細緻維護全螢幕檢視畫面（支援自訂圖片/GIF 或單一旋轉齒輪）
// ----------------------------------------------------
export function MaintenanceScreen({
  data,
  onCheckStatus,
  checking = false,
  checkMessage = null,
  isPreview = false,
}: MaintenanceScreenProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/25 to-slate-100 dark:from-[#080D1A] dark:via-[#0E172A] dark:to-[#080D1A] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 ${
        isPreview ? 'min-h-[480px] rounded-3xl border border-slate-200 dark:border-slate-800' : ''
      }`}
    >
      {/* 頂部輕量狀態列 */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            咩nu 團購點餐
          </span>
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-900/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>系統升級維護中</span>
          </span>
        </div>

        {!isPreview && (
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="切換深淺色主題"
            className="w-8 h-8 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 主體精美維護卡片 */}
      <div className="max-w-md mx-auto w-full my-auto py-6 space-y-6 text-center">
        {/* 中心視覺：若有上傳照片/GIF 則顯示，否則預設顯示單一旋轉維修齒輪 */}
        {data.custom_image_url ? (
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-sky-500/15 dark:bg-sky-400/20 rounded-3xl blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.custom_image_url}
              alt="維護公告自訂圖片"
              className="relative w-32 h-32 object-contain rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xs"
            />
          </div>
        ) : (
          <SingleMaintenanceGear />
        )}

        {/* 標題與維護公告內容 */}
        <div className="space-y-3">
          {data.reason && (
            <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-sky-200/80 dark:border-sky-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span>{data.reason.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '系統例行升級中'}</span>
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
            {data.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '網站更新中，請稍後再下單'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
            {data.message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() ||
              '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候。'}
          </p>
        </div>

        {/* 預估時間卡片 */}
        {data.estimated_end_time && (
          <div className="bg-white/80 dark:bg-[#131B2B]/90 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-xs mx-auto flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <IconClock className="w-4 h-4 text-sky-500 shrink-0" />
            <span>{data.estimated_end_time.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}</span>
          </div>
        )}

        {/* 漸變掃描動態進度條 */}
        <div className="max-w-xs mx-auto h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="w-full h-full animate-shimmer" />
        </div>

        {/* 重新檢查狀態按鈕 */}
        {onCheckStatus && !isPreview && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onCheckStatus}
              disabled={checking}
              className="w-full max-w-xs mx-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white text-xs font-extrabold py-3 px-5 rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <IconRefresh className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? '正在檢查系統狀態...' : '檢查維護是否已完成'}</span>
            </button>

            {checkMessage && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-in fade-in flex items-center justify-center gap-1.5">
                <IconAlertTriangle className="w-3.5 h-3.5" />
                <span>{checkMessage.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 底部輔助提示 */}
      <div className="max-w-md mx-auto w-full text-center pb-2">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          若有緊急點餐或帳務需求，請直接聯繫團長或主辦人員。
        </p>
      </div>
    </div>
  );
}
