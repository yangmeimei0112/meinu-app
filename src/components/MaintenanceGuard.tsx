'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MaintenanceData, MaintenanceScreen } from './maintenance/MaintenanceScreen';
import { DraggableFloatingCapsule } from './maintenance/DraggableFloatingCapsule';
import { useMaintenanceStatus, isRouteInMaintenance } from './maintenance/useMaintenanceStatus';
import MobileBottomNav from './MobileBottomNav';

export type { MaintenanceData };
export { MaintenanceScreen };

function IconAlertTriangle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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

/**
 * 🌟 僅在前台使用者頁面掛載的維護狀態監聽器
 * 嚴格與後台管理 (/admin) 隔離，支援「全站維護」與「單一頁面特定維護」
 */
function FrontendMaintenanceWatcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    maintenanceData,
    checking,
    checkMessage,
    countdown,
    isCountDownFinished,
    isCenterPopup,
    isMinimized,
    setIsMinimized,
    handleManualCheck,
  } = useMaintenanceStatus(pathname);

  // 判定當前頁面是否處於維護範圍內
  const isCurrentRouteLocked =
    maintenanceData?.is_maintenance && isRouteInMaintenance(pathname, maintenanceData.scope);

  const isSinglePageMaintenance =
    maintenanceData?.is_maintenance && maintenanceData.scope && maintenanceData.scope !== 'all';

  // 伺服端維護中、命中當前頁面範圍且倒數已結束：
  if (isCurrentRouteLocked && isCountDownFinished) {
    // 1. 若為「全站維護」：全螢幕鎖定畫面（不掛載導覽列）
    if (!isSinglePageMaintenance) {
      return (
        <MaintenanceScreen
          data={maintenanceData}
          onCheckStatus={handleManualCheck}
          checking={checking}
          checkMessage={checkMessage}
          isSinglePage={false}
        />
      );
    }

    // 2. 若為「單一頁面維護」：顯示該頁維護畫面，但保留底部導覽列供訪客前往其他正常頁面
    return (
      <div className="min-h-[100dvh] flex flex-col justify-between">
        <MaintenanceScreen
          data={maintenanceData}
          onCheckStatus={handleManualCheck}
          checking={checking}
          checkMessage={checkMessage}
          isSinglePage={true}
        />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <>
      {isCurrentRouteLocked && countdown !== null && (
        <>
          {/* 中央大提示彈窗 (前 3 秒醒目提示) */}
          {isCenterPopup && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-amber-500/50 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10">
                  <IconAlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-amber-400">該頁面即將進入維護模式</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {maintenanceData.message || '該頁面預計於倒數結束後開始維護，請儘速完成並送出您的操作！'}
                  </p>
                </div>
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
                  <span className="text-[11px] text-slate-400 block mb-1">距離正式關閉該頁面</span>
                  <span className="text-2xl font-black text-amber-400 font-mono tracking-wider">{countdown} 秒</span>
                </div>
                <button
                  type="button"
                  onClick={() => {}}
                  className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
                >
                  我知道了，繼續操作
                </button>
              </div>
            </div>
          )}

          {/* 懸浮可拖曳/可收合之 30 秒進度倒數條 */}
          {!isMinimized ? (
            <DraggableFloatingCapsule
              countdown={countdown}
              onExpand={() => setIsMinimized(true)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="fixed bottom-20 right-4 z-[9999] bg-amber-500 text-slate-950 px-3 py-2 rounded-full font-black text-xs shadow-xl flex items-center gap-1.5 animate-bounce-gentle hover:scale-105 active:scale-95 transition-all border-2 border-amber-300 cursor-pointer"
              title="展開維護倒數提示"
            >
              <IconAlertTriangle className="w-4 h-4" />
              <span>維護倒數 {countdown}s</span>
              <IconChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}

      {children}
    </>
  );
}

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 🛡️ 後台路徑 (/admin) 100% 完全直通，不掛載任何前台維護監聽與自動重整邏輯
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return <FrontendMaintenanceWatcher>{children}</FrontendMaintenanceWatcher>;
}
