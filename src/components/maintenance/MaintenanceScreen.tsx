'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/lib/theme';
import { TriangleWarningCore } from './TriangleWarningCore';
import { Clock, RefreshCw, Sun, Moon, AlertTriangle, ShieldCheck, Sparkles, Server } from 'lucide-react';
import type { MaintenanceScope } from '@/app/api/system/maintenance/route';

export interface MaintenanceData {
  is_maintenance: boolean;
  scope?: MaintenanceScope;
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  custom_image_url?: string;
  updated_at: string;
  build_id?: string;
}

interface MaintenanceScreenProps {
  data: MaintenanceData;
  onCheckStatus?: () => void;
  checking?: boolean;
  checkMessage?: string | null;
  isPreview?: boolean;
  isSinglePage?: boolean;
}

const SCOPE_LABELS: Record<MaintenanceScope, string> = {
  all: '全站維護升級中',
  home: '首頁大廳維護中',
  search: '探索搜尋頁維護中',
  stores: '店家菜單維護中',
  cart: '購物車功能維護中',
  checkout: '結帳送單維護中',
  'my-orders': '歷史訂單維護中',
};

// ----------------------------------------------------
// 🖼️ 現代高美感全螢幕維護畫面 (Modern Elegant Maintenance Screen)
// 支援深淺雙主題無縫適配、三角形驚嘆號動力核心、磨砂玻璃 Bento 卡片與全數自訂功能
// ----------------------------------------------------
export function MaintenanceScreen({
  data,
  onCheckStatus,
  checking = false,
  checkMessage = null,
  isPreview = false,
  isSinglePage = false,
}: MaintenanceScreenProps) {
  const { theme, toggleTheme } = useTheme();
  const currentScope = data.scope || 'all';
  const scopeText = SCOPE_LABELS[currentScope] || '系統維護中';

  return (
    <div
      className={`relative min-h-[100dvh] w-full bg-gradient-to-b from-slate-50 via-amber-50/20 to-slate-100 dark:from-[#060911] dark:via-[#0E1524] dark:to-[#060911] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-300 overflow-hidden select-none ${
        isPreview ? 'min-h-[520px] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl' : ''
      } ${isSinglePage ? 'pb-28' : ''}`}
    >
      {/* 🌟 1. 微矩陣網格紋理 (Subtle Cyber Dot Matrix Grid) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(245, 158, 11, 0.3) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 85%)',
        }}
      />

      {/* 🌟 2. 雙層環境氛圍脈衝光球 (Ambient Radial Glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-[90px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-sky-500/10 dark:bg-indigo-600/15 rounded-full blur-[90px] pointer-events-none" />

      {/* 🔝 頂部導覽列與狀態識別 */}
      <header className="relative z-10 max-w-md mx-auto w-full flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <Image
              src="/logoforfrontpage.svg"
              alt="咩nu Logo"
              width={92}
              height={30}
              priority
              className="object-contain h-7 w-auto dark:brightness-110"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span>{scopeText}</span>
          </div>
        </div>

        {!isPreview && (
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="切換深淺色主題"
            className="w-8 h-8 rounded-xl font-bold bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        )}
      </header>

      {/* 🎯 核心主體 Bento 玻璃卡片 */}
      <main className="relative z-10 max-w-md mx-auto w-full my-auto py-3 space-y-4 text-center">
        {/* 1. 中心視覺區域：支援自訂圖片/GIF 或新版三角形驚嘆號動力核心 */}
        {data.custom_image_url ? (
          <div className="relative w-44 h-44 mx-auto flex items-center justify-center animate-float-slow">
            {/* 全息光暈背景 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/25 to-sky-500/25 rounded-3xl blur-xl" />

            {/* 科技角標裝飾 (Cyber Corner Brackets) */}
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-500 dark:border-amber-400 rounded-tl-sm pointer-events-none" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-500 dark:border-amber-400 rounded-tr-sm pointer-events-none" />
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-500 dark:border-amber-400 rounded-bl-sm pointer-events-none" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-500 dark:border-amber-400 rounded-br-sm pointer-events-none" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.custom_image_url}
              alt="維護公告自訂圖片"
              className="relative w-40 h-40 object-contain rounded-2xl shadow-xl border border-amber-300/80 dark:border-amber-400/50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md p-2"
            />
          </div>
        ) : (
          <TriangleWarningCore />
        )}

        {/* 2. 標題與公告資訊區域 (Bento Glass Panel) */}
        <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl border border-white/60 dark:border-slate-800/80 rounded-3xl p-5 shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] space-y-3">
          {/* 常用事由與伺服器節點膠囊 */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {data.reason && (
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-amber-500/25 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{data.reason.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '系統例行升級'}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700/60">
              <Server className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <span>NODE_ONLINE</span>
            </div>
          </div>

          {/* 大標題 */}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
            {data.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '網站升級中，請稍候再下單'}
          </h1>

          {/* 維護詳細廣播內容 */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
            {data.message.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() ||
              '為了提供更極速流暢的揪團點餐體驗，網站目前正在進行系統升級。暫停點餐服務，感謝您的耐心等候！'}
          </p>

          {/* 預計完成時間晶片卡片 */}
          {data.estimated_end_time && (
            <div className="bg-amber-50/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-amber-200/80 dark:border-slate-700/70 shadow-2xs max-w-xs mx-auto flex items-center justify-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 font-mono">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.5]" />
              <span>{data.estimated_end_time.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}</span>
            </div>
          )}
        </div>

        {/* 3. 重新檢查狀態互動按鈕 */}
        {onCheckStatus && !isPreview && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onCheckStatus}
              disabled={checking}
              className="w-full max-w-xs mx-auto relative group overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white text-xs font-black py-3 px-5 rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {/* 按鈕微光光澤 (Button Glow Shimmer) */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{checking ? '正在即時檢查狀態...' : '檢查維護是否已完成'}</span>
            </button>

            {checkMessage && (
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 animate-in fade-in flex items-center justify-center gap-1.5 bg-amber-500/15 py-2 px-3 rounded-xl max-w-xs mx-auto border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>{checkMessage.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 🔻 底部安全與團長聯絡提示 */}
      <footer className="relative z-10 max-w-md mx-auto w-full text-center pb-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>若有緊急點餐或帳務需求，請直接聯繫團長主辦人員</span>
        </div>
      </footer>
    </div>
  );
}
