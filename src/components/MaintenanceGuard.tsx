'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme';

export interface MaintenanceData {
  is_maintenance: boolean;
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  updated_at: string;
  build_id?: string;
}

// ----------------------------------------------------
// 🧹 強制清除所有快取並帶隨機時間戳硬重整至最新版本
// ----------------------------------------------------
async function forceHardReloadToLatestVersion(targetUrl?: string) {
  try {
    // 1. 清除 Service Worker 註冊 (若有)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    // 2. 清除瀏覽器 CacheStorage 快取
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    // 3. 清除 SessionStorage 維護鎖定標記
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('meinu_maintenance_locked');
      sessionStorage.removeItem('meinu_maintenance_deadline');
    }
  } catch (e) {
    console.error('快取清理出錯:', e);
  }

  // 4. 強制帶隨機時間戳硬重整 (Bypass Browser HTTP Cache)
  if (typeof window !== 'undefined') {
    const url = new URL(targetUrl || window.location.href);
    url.searchParams.set('_update', String(Date.now()));
    window.location.replace(url.toString());
  }
}

// ----------------------------------------------------
// 🎨 純 SVG 精緻向量圖示集（無任何 Emoji）
// ----------------------------------------------------
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

function IconChevronUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconMove({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

// ----------------------------------------------------
// ⚙️ 精緻多重齒輪組與幾何雷射環 SVG 動畫組件 (無任何 Emoji)
// ----------------------------------------------------
function VectorPrecisionGears() {
  return (
    <div className="relative w-40 h-40 mx-auto flex items-center justify-center select-none">
      {/* 1. 背景科技霓虹脈衝光暈 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-blue-500/20 to-amber-500/15 rounded-full blur-2xl animate-pulse-glow" />

      {/* 2. 外部軌道虛線雷射環 */}
      <svg className="absolute inset-0 w-full h-full animate-spin-slow opacity-40 text-sky-500 dark:text-sky-400" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />
        <circle cx="80" cy="80" r="66" fill="none" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.5" />
      </svg>

      {/* 3. 反向精密科技輔助環 */}
      <svg className="absolute w-32 h-32 animate-spin-reverse opacity-30 text-blue-600 dark:text-blue-400" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r="58" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 12" />
        <path d="M65 5 L65 15 M65 115 L65 125 M5 65 L15 65 M115 65 L125 65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* 4. 主齒輪 (大)：順時針精密咬合齒輪 */}
      <div className="absolute w-24 h-24 text-sky-600 dark:text-sky-400 animate-spin-slow">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <path
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
            d="M50 15 
               L53 15 L55 22 L62 25 L68 20 L73 24 L70 31 L76 36 L83 34 L85 41 L80 47 L82 53 L89 57 L87 64 L80 66 L78 73 L83 79 L78 84 L72 80 L66 84 L65 91 L58 91 L55 84 L48 84 L45 91 L38 91 L37 84 L31 80 L25 84 L20 79 L25 73 L23 66 L16 64 L14 57 L21 53 L23 47 L18 41 L20 34 L27 36 L33 31 L30 24 L35 20 L41 25 L48 22 Z"
          />
          <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
        </svg>
      </div>

      {/* 5. 次齒輪 (小)：逆時針咬合輔助齒輪 */}
      <div className="absolute -top-1 -right-1 w-14 h-14 text-amber-500 dark:text-amber-400 animate-spin-reverse">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-sm">
          <path
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            d="M30 8 L33 8 L35 14 L40 16 L45 13 L48 16 L46 21 L50 25 L55 24 L56 29 L51 33 L52 38 L57 41 L55 46 L49 46 L47 51 L50 55 L46 58 L42 55 L38 58 L37 63 L32 63 L30 58 Z"
          />
          <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="30" cy="30" r="3.5" fill="currentColor" />
        </svg>
      </div>

      {/* 6. 中心核心晶片徽章 (科技浮動) */}
      <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg animate-bounce-gentle">
        <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center text-sky-400">
          <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 🖼️ 細緻維護全螢幕檢視畫面（100% 向量化，無 Emoji）
// ----------------------------------------------------
export function MaintenanceScreen({
  data,
  onCheckStatus,
  checking = false,
  checkMessage = null,
  isPreview = false,
}: {
  data: MaintenanceData;
  onCheckStatus?: () => void;
  checking?: boolean;
  checkMessage?: string | null;
  isPreview?: boolean;
}) {
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

      {/* 主體精美向量維護卡片 */}
      <div className="max-w-md mx-auto w-full my-auto py-6 space-y-6 text-center">
        {/* 精緻多重齒輪組動畫 */}
        <VectorPrecisionGears />

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

// ----------------------------------------------------
// 📱 極致 0 延遲原生 Pointer 拖曳懸浮倒數膠囊組件 (Draggable Capsule)
// ----------------------------------------------------
function DraggableFloatingCapsule({
  countdown,
  onExpand,
}: {
  countdown: number;
  onExpand: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 16,
    initialPosY: 16,
    hasMoved: false,
  });
  const capsuleRef = useRef<HTMLDivElement>(null);

  // 初始化預設位置（置於螢幕頂部居中偏右）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultWidth = 230;
      const initialX = Math.max(12, Math.min(window.innerWidth - defaultWidth - 12, (window.innerWidth - defaultWidth) / 2));
      const initialY = 16;
      setPos({ x: initialX, y: initialY });
      dragInfoRef.current.initialPosX = initialX;
      dragInfoRef.current.initialPosY = initialY;
    }
  }, []);

  // 1. 原生 PointerDown：啟動指標捕獲與即時座標追蹤 (支援滑鼠與手機觸控)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // 僅響應主鍵/單指點觸

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;
    setIsDragging(true);

    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: pos.x,
      initialPosY: pos.y,
      hasMoved: false,
    };
  };

  // 2. 原生 PointerMove：硬體加速 1:1 即時無延遲跟隨移動
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragInfoRef.current.hasMoved = true;
    }

    const elWidth = capsuleRef.current?.offsetWidth || 230;
    const elHeight = capsuleRef.current?.offsetHeight || 44;

    const newX = Math.max(8, Math.min(window.innerWidth - elWidth - 8, dragInfoRef.current.initialPosX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - elHeight - 8, dragInfoRef.current.initialPosY + dy));

    setPos({ x: newX, y: newY });
  };

  // 3. 原生 PointerUp：釋放指標捕獲，並精準判定是「輕觸展開」還是「拖曳結束」
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const moved = dragInfoRef.current.hasMoved;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (!moved) {
      onExpand();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  return (
    <div
      ref={capsuleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        zIndex: 99999,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      className={`select-none bg-slate-900/95 text-amber-400 border-2 border-amber-500/80 shadow-2xl backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-2.5 pointer-events-auto cursor-grab active:cursor-grabbing will-change-transform ${
        isDragging
          ? 'scale-105 shadow-amber-500/40 ring-4 ring-amber-400/30 transition-none'
          : 'hover:scale-102 hover:border-amber-400 transition-transform duration-150'
      }`}
    >
      <div className="flex items-center gap-1.5 pointer-events-none">
        <IconAlertTriangle className="w-4 h-4 animate-pulse text-amber-400 shrink-0" />
        <span className="tabular-nums font-black text-amber-300">維護倒數 {countdown}s</span>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700 pointer-events-none">
        <IconMove className="w-3 h-3 text-slate-400" />
        <span>拖移 / 點擊展開</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 🛡️ 前台主防護攔截器 (60fps 流暢進度條 + 跨版本自動強制重整同步)
// ----------------------------------------------------
export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // 🔔 30 秒倒數與狀態控制
  const [countdown, setCountdown] = useState<number | null>(null);
  const [smoothProgress, setSmoothProgress] = useState<number>(100);
  const [isCountDownFinished, setIsCountDownFinished] = useState<boolean>(false);
  const [isCenterPopup, setIsCenterPopup] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const initialCheckDoneRef = useRef<boolean>(false);
  const deadlineRef = useRef<number | null>(null);
  const wasInMaintenanceRef = useRef<boolean>(false);
  const initialClientBuildRef = useRef<string>(process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'dev');

  // 1. 初始化讀取 SessionStorage 狀態（防止重整或跳轉頁面時繞過）
  useEffect(() => {
    try {
      const savedLocked = sessionStorage.getItem('meinu_maintenance_locked');
      if (savedLocked === 'true') {
        setIsCountDownFinished(true);
        wasInMaintenanceRef.current = true;
      }
      const savedDeadline = sessionStorage.getItem('meinu_maintenance_deadline');
      if (savedDeadline) {
        const dl = Number(savedDeadline);
        if (Date.now() >= dl) {
          setIsCountDownFinished(true);
          wasInMaintenanceRef.current = true;
          sessionStorage.setItem('meinu_maintenance_locked', 'true');
        } else {
          deadlineRef.current = dl;
          setCountdown(Math.max(1, Math.ceil((dl - Date.now()) / 1000)));
        }
      }
    } catch {}
  }, []);

  // 2. 輪詢查詢伺服端維護狀態與版本
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json: MaintenanceData = await res.json();
        setMaintenanceData((prev) => {
          if (json.is_maintenance) {
            // 🔴 伺服端處於維護狀態中
            wasInMaintenanceRef.current = true;

            if (!initialCheckDoneRef.current) {
              // 首次載入若伺服端本就處於維護中，檢查是否有現存倒數
              const savedDeadline = sessionStorage.getItem('meinu_maintenance_deadline');
              if (savedDeadline && Number(savedDeadline) > Date.now()) {
                const dl = Number(savedDeadline);
                deadlineRef.current = dl;
                setCountdown(Math.max(1, Math.ceil((dl - Date.now()) / 1000)));
              } else {
                setIsCountDownFinished(true);
                sessionStorage.setItem('meinu_maintenance_locked', 'true');
              }
            } else if (!prev?.is_maintenance && !deadlineRef.current) {
              // 使用者在使用中，後台剛開啟維護模式：觸發 30 秒倒數 + 3秒置中動畫
              const targetDeadline = Date.now() + 30000;
              deadlineRef.current = targetDeadline;
              try {
                sessionStorage.setItem('meinu_maintenance_deadline', String(targetDeadline));
              } catch {}

              setCountdown(30);
              setSmoothProgress(100);
              setIsCenterPopup(true);

              setTimeout(() => {
                setIsCenterPopup(false);
              }, 3000);
            }
          } else {
            // 🟢 伺服端已關閉維護 (或原本即為正常營運)
            const hadBeenInMaintenance =
              wasInMaintenanceRef.current || sessionStorage.getItem('meinu_maintenance_locked') === 'true';
            const serverBuildId = json.build_id;
            const isNewVersionDeployed =
              serverBuildId &&
              serverBuildId !== 'dev' &&
              serverBuildId !== initialClientBuildRef.current;

            // 🚀 關鍵防護：若使用者先前處於維護畫面，或維護期間已部署新版本至 GitHub
            // ➜ 即刻強制清除所有快取並硬重整以載入最新版本，絕不停留於舊版本！
            if (hadBeenInMaintenance || isNewVersionDeployed) {
              wasInMaintenanceRef.current = false;
              deadlineRef.current = null;
              forceHardReloadToLatestVersion();
              return json;
            }

            deadlineRef.current = null;
            setCountdown(null);
            setSmoothProgress(100);
            setIsCountDownFinished(false);
            setIsCenterPopup(false);
            setIsMinimized(false);
            try {
              sessionStorage.removeItem('meinu_maintenance_deadline');
              sessionStorage.removeItem('meinu_maintenance_locked');
            } catch {}
          }
          return json;
        });

        initialCheckDoneRef.current = true;
        return json;
      }
    } catch (e) {
      console.error('查詢維護狀態失敗', e);
    }
    return null;
  }, []);

  // 3. 每 4 秒於背景定時輪詢檢查最新維護狀態
  useEffect(() => {
    fetchMaintenanceStatus();
    const timer = setInterval(() => {
      fetchMaintenanceStatus();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchMaintenanceStatus]);

  // 4. 60fps 無卡頓流暢微進度條動畫（基於 requestAnimationFrame）
  useEffect(() => {
    if (!deadlineRef.current) return;
    let animId: number;

    const updateSmoothProgress = () => {
      if (!deadlineRef.current) return;
      const now = Date.now();
      const remainingMs = deadlineRef.current - now;
      const totalDurationMs = 30000;
      const pct = Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100));
      setSmoothProgress(pct);

      if (remainingMs > 0) {
        animId = requestAnimationFrame(updateSmoothProgress);
      }
    };

    animId = requestAnimationFrame(updateSmoothProgress);
    return () => cancelAnimationFrame(animId);
  }, [countdown]);

  // 5. 精密秒數倒數計時器（以絕對時間戳記計算，防頁面卡頓或背景 Tab 延遲）
  useEffect(() => {
    if (!deadlineRef.current) return;

    const tick = () => {
      if (!deadlineRef.current) return;
      const remaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);

      if (remaining <= 0) {
        // 🔒 倒數結束：100% 絕對鎖定並切換至全螢幕維護頁面
        setIsCountDownFinished(true);
        wasInMaintenanceRef.current = true;
        setCountdown(null);
        setSmoothProgress(0);
        deadlineRef.current = null;
        try {
          sessionStorage.setItem('meinu_maintenance_locked', 'true');
          sessionStorage.removeItem('meinu_maintenance_deadline');
        } catch {}
      } else {
        setCountdown(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 300);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleManualCheck = async () => {
    setChecking(true);
    setCheckMessage(null);
    const updated = await fetchMaintenanceStatus();
    setChecking(false);

    if (updated) {
      if (!updated.is_maintenance) {
        setCheckMessage('維護已完成！正在為您同步載入最新版本...');
        setTimeout(() => {
          forceHardReloadToLatestVersion();
        }, 500);
      } else {
        setCheckMessage('系統仍在庫升級中，請稍後再試。');
        setTimeout(() => setCheckMessage(null), 4000);
      }
    }
  };

  const handleImmediateSwitch = () => {
    setIsCountDownFinished(true);
    wasInMaintenanceRef.current = true;
    setCountdown(null);
    setSmoothProgress(0);
    deadlineRef.current = null;
    try {
      sessionStorage.setItem('meinu_maintenance_locked', 'true');
      sessionStorage.removeItem('meinu_maintenance_deadline');
    } catch {}
  };

  // 🛡️ 後台管理者路由 (`/admin` 或 `/api`) 永遠不受維護模式阻擋
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/api');

  // 🚨 終極防線：若處於維護模式且倒數已結束，強制全螢幕阻斷，不渲染任何前台互動內容
  if (maintenanceData?.is_maintenance && isCountDownFinished && !isAdminRoute) {
    return (
      <MaintenanceScreen
        data={maintenanceData}
        onCheckStatus={handleManualCheck}
        checking={checking}
        checkMessage={checkMessage}
      />
    );
  }

  return (
    <>
      {/* ⚠️ 30 秒預警通知：前 3 秒置中彈窗，3 秒後平滑轉移至頂部橫幅 (含 60fps 平滑進度條與可拖移懸浮膠囊) */}
      {maintenanceData?.is_maintenance && countdown !== null && countdown > 0 && !isAdminRoute && (
        <>
          {/* 1. 前 3 秒：畫面正中央彈出式動畫 */}
          {isCenterPopup && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
              <div className="max-w-md w-full bg-slate-900 text-white rounded-3xl p-6 border-2 border-amber-500 shadow-2xl space-y-4 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <IconAlertTriangle className="w-7 h-7 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 font-extrabold px-3 py-1 rounded-full border border-amber-500/40">
                    系統即將進行維護升級
                  </span>
                  <h3 className="text-lg font-black text-amber-400 pt-1">
                    {countdown} 秒後切換至維護模式
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {maintenanceData.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '網站即將進入例行維護'}
                    ：請儘速完成目前的點餐或送單動作。
                  </p>
                </div>

                {/* 60fps 平滑流暢進度條 */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full will-change-[width]"
                    style={{ width: `${smoothProgress}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCenterPopup(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    移動至頂部繼續操作
                  </button>
                  <button
                    type="button"
                    onClick={handleImmediateSwitch}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    立即進入維護
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. 3 秒後：移至畫面頂部 (支援縮小為可自由拖移的懸浮膠囊) */}
          {!isCenterPopup && (
            <>
              {isMinimized ? (
                /* 極致 0 延遲原生 Pointer 拖曳懸浮膠囊 */
                <DraggableFloatingCapsule
                  countdown={countdown}
                  onExpand={() => setIsMinimized(false)}
                />
              ) : (
                /* 頂部展開警示橫幅 */
                <div className="fixed inset-x-0 top-0 z-[9998] p-3 sm:p-4 pointer-events-none">
                  <div className="max-w-2xl mx-auto bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-amber-500/60 shadow-2xl space-y-2.5 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <IconAlertTriangle className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-amber-400">
                              系統維護預警廣播
                            </h4>
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
                              {countdown} 秒後切換
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed truncate sm:whitespace-normal">
                            {maintenanceData.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '網站即將進入例行維護'}
                            ：請儘速送單。
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* 立即切換 */}
                        <button
                          type="button"
                          onClick={handleImmediateSwitch}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
                        >
                          立即切換
                        </button>

                        {/* 隱藏/縮小通知按鈕 */}
                        <button
                          type="button"
                          onClick={() => setIsMinimized(true)}
                          aria-label="縮小隱藏通知"
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 flex items-center justify-center transition cursor-pointer"
                          title="隱藏此橫幅（縮小為可拖曳膠囊）"
                        >
                          <IconChevronUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 60fps 平滑流暢進度條（無 1 秒停頓） */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 rounded-full will-change-[width]"
                        style={{ width: `${smoothProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {children}
    </>
  );
}
