'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MaintenanceData, MaintenanceScreen } from './maintenance/MaintenanceScreen';
import { DraggableFloatingCapsule } from './maintenance/DraggableFloatingCapsule';
import { useMaintenanceStatus, isRouteInMaintenance } from './maintenance/useMaintenanceStatus';
import MobileBottomNav from './MobileBottomNav';

export type { MaintenanceData };
export { MaintenanceScreen };

const SCOPE_NAMES: Record<string, string> = {
  all: '全站',
  home: '首頁大廳',
  search: '搜尋探索',
  stores: '店家菜單',
  cart: '購物車',
  checkout: '結帳送單',
  'my-orders': '歷史訂單',
};

function IconAlertTriangle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconZap({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
function FrontendMaintenanceWatcher({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: MaintenanceData;
}) {
  const pathname = usePathname();
  const {
    maintenanceData,
    checking,
    checkMessage,
    countdown,
    isCountDownFinished,
    isCenterPopup,
    dismissCenterPopup,
    isMinimized,
    setIsMinimized,
    handleManualCheck,
  } = useMaintenanceStatus(pathname, initialData);

  // 判定當前頁面是否處於維護範圍內
  const isCurrentRouteLocked =
    maintenanceData?.is_maintenance && isRouteInMaintenance(pathname, maintenanceData.scope);

  const isSinglePageMaintenance =
    maintenanceData?.is_maintenance && maintenanceData.scope && maintenanceData.scope !== 'all';

  const currentScope = maintenanceData?.scope || 'all';
  const scopeLabel = SCOPE_NAMES[currentScope] || '本頁';

  // 伺服端維護中、命中當前頁面範圍且倒數已結束（或重新載入/新訪客 0ms 鎖定）：
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
          {/* 🌟 中央大提示廣播彈窗 (針對後台開啟當下在線使用者發布，樣式依範圍智慧區分) */}
          {isCenterPopup && (
            <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 select-none">
              {isSinglePageMaintenance ? (
                // ⚡【單一頁面特定維護】專屬風格：電光紫/科技藍靛 (Cyber Violet / Cyan Indigo)
                <div className="relative overflow-hidden bg-[#0D1220]/95 border-2 border-violet-500/70 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl shadow-violet-500/25 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

                  {/* 頂部圖示 */}
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/20 text-violet-300 flex items-center justify-center mx-auto ring-8 ring-violet-500/10 border border-violet-500/30">
                    <IconZap className="w-7 h-7 text-cyan-300 animate-pulse" />
                  </div>

                  {/* 標題與說明 */}
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-violet-500/20 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-violet-400/30 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>⚡ 特定分頁局部維護</span>
                    </div>
                    <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-cyan-200 to-white">
                      【{scopeLabel}】即將進入專屬維護
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {maintenanceData?.message || '目前僅針對本分頁進行特定升級維護。倒數結束後僅鎖定本頁面，其他頁面仍可正常使用！'}
                    </p>
                  </div>

                  {/* 倒數計時框 */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-violet-800/60 shadow-inner">
                    <span className="text-[11px] text-slate-400 block mb-1">距離本分頁關閉維修</span>
                    <span className="text-3xl font-black text-cyan-300 font-mono tracking-wider">{countdown} 秒</span>
                    <span className="text-[10px] text-emerald-400/90 block mt-1">✨ 其他大廳、店家菜單與訂單頁面不受影響</span>
                  </div>

                  {/* 關閉按鈕 */}
                  <button
                    type="button"
                    onClick={dismissCenterPopup}
                    className="w-full text-xs text-white font-extrabold transition px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 border border-violet-400/30 shadow-md shadow-violet-600/30 cursor-pointer"
                  >
                    我知道了，把握時間操作
                  </button>
                </div>
              ) : (
                // 🚨【全站例行維護】專屬風格：烈焰赤紅/琥珀暗金 (Crimson Flame / Amber Gold)
                <div className="relative overflow-hidden bg-slate-950/95 border-2 border-amber-500/70 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl shadow-amber-500/25 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

                  {/* 頂部圖示 */}
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10 border border-amber-500/30">
                    <IconAlertTriangle className="w-7 h-7 text-amber-400 animate-pulse" />
                  </div>

                  {/* 標題與說明 */}
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-400/30 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>🚨 全站例行維護升級</span>
                    </div>
                    <h3 className="text-lg font-black text-amber-300">
                      平台即將進入全站例行維護
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {maintenanceData?.message || '為了提供更好的服務品質，平台即將進行全站升級維護，倒數結束後全站將暫停服務並進入維修畫面。'}
                    </p>
                  </div>

                  {/* 倒數計時框 */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-amber-700/60 shadow-inner">
                    <span className="text-[11px] text-slate-400 block mb-1">距離全站正式進入維修</span>
                    <span className="text-3xl font-black text-amber-400 font-mono tracking-wider">{countdown} 秒</span>
                    <span className="text-[10px] text-amber-300/80 block mt-1">請儘速完成並送出您當前的點餐操作</span>
                  </div>

                  {/* 關閉按鈕 */}
                  <button
                    type="button"
                    onClick={dismissCenterPopup}
                    className="w-full text-xs text-slate-950 font-extrabold transition px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 border border-amber-300 shadow-md shadow-amber-500/30 cursor-pointer"
                  >
                    我知道了，把握時間操作
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 懸浮可拖曳/可收合之 30 秒進度倒數條 (自動適配全站 vs 單頁風格) */}
          {!isMinimized ? (
            <DraggableFloatingCapsule
              countdown={countdown}
              scope={currentScope}
              scopeLabel={scopeLabel}
              onExpand={() => setIsMinimized(true)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className={`fixed bottom-20 right-4 z-[9999] px-3 py-2 rounded-full font-black text-xs shadow-2xl flex items-center gap-1.5 animate-bounce-gentle hover:scale-105 active:scale-95 transition-all border-2 cursor-pointer ${
                isSinglePageMaintenance
                  ? 'bg-violet-600 text-white border-cyan-300 shadow-violet-500/40'
                  : 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/40'
              }`}
              title="展開維護倒數提示"
            >
              {isSinglePageMaintenance ? (
                <IconZap className="w-4 h-4 text-cyan-300" />
              ) : (
                <IconAlertTriangle className="w-4 h-4" />
              )}
              <span>
                {isSinglePageMaintenance ? `【${scopeLabel}】` : '全站'}倒數 {countdown}s
              </span>
              <IconChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}

      {children}
    </>
  );
}

export default function MaintenanceGuard({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData?: MaintenanceData;
}) {
  const pathname = usePathname();

  // 🛡️ 後台路徑 (/admin) 100% 完全直通，不掛載任何前台維護監聽與自動重整邏輯
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <FrontendMaintenanceWatcher initialData={initialData}>
      {children}
    </FrontendMaintenanceWatcher>
  );
}
