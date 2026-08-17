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

function IconCheck({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
          {/* 齒輪主體 */}
          <path
            fill="currentColor"
            fillOpacity="0.15"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
            d="M50 15 
               L53 15 L55 22 L62 25 L68 20 L73 24 L70 31 L76 36 L83 34 L85 41 L80 47 L82 53 L89 57 L87 64 L80 66 L78 73 L83 79 L78 84 L72 80 L66 84 L65 91 L58 91 L55 84 L48 84 L45 91 L38 91 L37 84 L31 80 L25 84 L20 79 L25 73 L23 66 L16 64 L14 57 L21 53 L23 47 L18 41 L20 34 L27 36 L33 31 L30 24 L35 20 L41 25 L48 22 Z"
          />
          {/* 內同心圓與幾何刻度 */}
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
// 🛡️ 前台主防護攔截器 (含 30 秒預警廣播與平滑倒數機制)
// ----------------------------------------------------
export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  // 🔔 30 秒倒數狀態管理
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountDownFinished, setIsCountDownFinished] = useState<boolean>(false);
  const initialCheckDoneRef = useRef<boolean>(false);

  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json: MaintenanceData = await res.json();
        setMaintenanceData((prev) => {
          // 偵測是否由「非維護」剛轉為「維護中」，且使用者當前正在瀏覽前台
          if (json.is_maintenance) {
            if (!initialCheckDoneRef.current) {
              // 首次剛開啟網站時若已處於維護中，直接進入維護頁
              setIsCountDownFinished(true);
            } else if (!prev?.is_maintenance && countdown === null) {
              // 若使用者在使用中，後台剛開啟維護模式，觸發 30 秒預警倒數
              setCountdown(30);
            }
          } else {
            // 若後台關閉維護，重置倒數與鎖定
            setCountdown(null);
            setIsCountDownFinished(false);
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
  }, [countdown]);

  // 1. 每 5 秒於背景定時輪詢檢查最新維護狀態
  useEffect(() => {
    fetchMaintenanceStatus();
    const timer = setInterval(() => {
      fetchMaintenanceStatus();
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchMaintenanceStatus]);

  // 2. 30 秒倒數計時器計數邏輯
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      setIsCountDownFinished(true);
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleManualCheck = async () => {
    setChecking(true);
    setCheckMessage(null);
    const updated = await fetchMaintenanceStatus();
    setChecking(false);

    if (updated) {
      if (!updated.is_maintenance) {
        setCheckMessage('維護已完成！正在為您重新載入頁面...');
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } else {
        setCheckMessage('系統仍在庫升級中，請稍後再試。');
        setTimeout(() => setCheckMessage(null), 4000);
      }
    }
  };

  const handleImmediateSwitch = () => {
    setIsCountDownFinished(true);
    setCountdown(null);
  };

  // 🛡️ 後台管理者路由 (`/admin` 或 `/api`) 永遠不受維護模式阻擋
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/api');

  // 若處於維護中，且倒數已結束或初始就處於維護中：全螢幕呈現維護頁面
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
      {/* ⚠️ 30 秒即將維護前台預警橫幅 (使用者操作中偵測到維護時觸發) */}
      {maintenanceData?.is_maintenance && countdown !== null && countdown > 0 && !isAdminRoute && (
        <div className="fixed inset-x-0 top-0 z-[9999] p-3 sm:p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="max-w-2xl mx-auto bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 sm:p-4.5 border border-amber-500/60 shadow-2xl space-y-3">
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
                  <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed">
                    {maintenanceData.title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim() || '網站即將進入例行維護'}
                    ：請儘速完成目前之動作，系統將於倒數完畢後切換至維護畫面。
                  </p>
                </div>
              </div>

              {/* 立即切換按鈕 */}
              <button
                type="button"
                onClick={handleImmediateSwitch}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition shadow-xs active:scale-95 shrink-0 cursor-pointer"
              >
                立即進入維護
              </button>
            </div>

            {/* 30 秒流動倒數進度條 */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
