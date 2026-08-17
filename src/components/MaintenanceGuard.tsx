'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
      className={`min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-slate-100 dark:from-[#080D1A] dark:via-[#0E172A] dark:to-[#080D1A] text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 ${
        isPreview ? 'min-h-[460px] rounded-3xl border border-slate-200 dark:border-slate-800' : ''
      }`}
    >
      {/* 頂部輕量狀態列 */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            咩nu 團購點餐
          </span>
          <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-900/60">
            維護模式
          </span>
        </div>

        {!isPreview && (
          <button
            type="button"
            onClick={toggleTheme}
            className="text-xs px-2.5 py-1 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
            title="切換亮色/暗色主題"
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
        )}
      </div>

      {/* 主體精美維護卡片與動畫 */}
      <div className="max-w-md mx-auto w-full my-auto py-6 space-y-6 text-center">
        {/* 精緻 CSS 齒輪與料理鍋飄浮動畫 */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          {/* 背景脈衝光環 */}
          <div className="absolute inset-0 bg-sky-400/20 dark:bg-sky-500/20 rounded-full blur-xl animate-pulse" />

          {/* 旋轉外環齒輪 (大) */}
          <div className="absolute w-28 h-28 border-4 border-dashed border-sky-400/50 dark:border-sky-500/40 rounded-full animate-spin-slow" />

          {/* 反向旋轉內環 (小) */}
          <div
            className="absolute w-20 h-20 border-2 border-dotted border-blue-500/60 dark:border-blue-400/50 rounded-full animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '8s' }}
          />

          {/* 中心主要插圖 (小羊廚師 / 烹飪鍋) */}
          <div className="relative w-16 h-16 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-3xl shadow-lg flex items-center justify-center text-3xl animate-bounce-gentle border-2 border-white/80 dark:border-slate-700">
            <span>🍲</span>
          </div>

          {/* 飄浮小工具裝飾 */}
          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-md animate-pulse">
            <span>⚙️</span>
          </div>
          <div className="absolute -bottom-1 -left-1 bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-300 text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-md border border-sky-200 dark:border-slate-700 animate-bounce">
            <span>🔧</span>
          </div>
        </div>

        {/* 標題與維護公告內容 */}
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-sky-200/80 dark:border-sky-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
            <span>{data.reason || '系統例行升級中'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
            {data.title || '🚧 網站更新中，請稍後再下單'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-relaxed max-w-sm mx-auto font-medium">
            {data.message ||
              '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候！'}
          </p>
        </div>

        {/* 預估時間卡片 */}
        {data.estimated_end_time && (
          <div className="bg-white/80 dark:bg-[#131B2B]/90 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-xs mx-auto flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="text-base">🕒</span>
            <span>{data.estimated_end_time}</span>
          </div>
        )}

        {/* 重新檢查狀態按鈕 */}
        {onCheckStatus && !isPreview && (
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onCheckStatus}
              disabled={checking}
              className="w-full max-w-xs mx-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white text-xs font-extrabold py-3 px-5 rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <span className={checking ? 'animate-spin' : ''}>🔄</span>
              <span>{checking ? '正在檢查系統狀態...' : '檢查維護是否已完成'}</span>
            </button>

            {checkMessage && (
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-in fade-in">
                {checkMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 底部輔助提示 */}
      <div className="max-w-md mx-auto w-full text-center pb-2">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          若您有緊急訂單或餐點疑問，請直接聯繫團長或主辦人。
        </p>
      </div>
    </div>
  );
}

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setMaintenanceData(json);
        return json;
      }
    } catch (e) {
      console.error('查詢維護狀態失敗', e);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchMaintenanceStatus();

    // 每 10 秒在背景定時輪詢檢查維護狀態
    const timer = setInterval(() => {
      fetchMaintenanceStatus();
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchMaintenanceStatus]);

  const handleManualCheck = async () => {
    setChecking(true);
    setCheckMessage(null);
    const updated = await fetchMaintenanceStatus();
    setChecking(false);

    if (updated) {
      if (!updated.is_maintenance) {
        setCheckMessage('🎉 維護已完成！正在為您載入最新點餐頁面...');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setCheckMessage('⏳ 系統仍在維護升級中，請稍後再試！');
        setTimeout(() => setCheckMessage(null), 4000);
      }
    }
  };

  // 🛡️ 後台管理者路由 (`/admin` 或 `/api`) 永不受維護模式阻擋，確保團長可隨時管理
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/api');

  if (maintenanceData?.is_maintenance && !isAdminRoute) {
    return (
      <MaintenanceScreen
        data={maintenanceData}
        onCheckStatus={handleManualCheck}
        checking={checking}
        checkMessage={checkMessage}
      />
    );
  }

  return <>{children}</>;
}
