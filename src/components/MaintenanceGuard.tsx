'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MaintenanceData, MaintenanceScreen } from './maintenance/MaintenanceScreen';
import { DraggableFloatingCapsule } from './maintenance/DraggableFloatingCapsule';

export type { MaintenanceData };
export { MaintenanceScreen };

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
// 🎨 純 SVG 精緻向量圖示集
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

function IconChevronUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
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

  // 1. 初始化讀取 SessionStorage 狀態
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

  // 4. 60fps 無卡頓流暢微進度條動畫
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

  // 5. 精密秒數倒數計時器
  useEffect(() => {
    if (!deadlineRef.current) return;

    const tick = () => {
      if (!deadlineRef.current) return;
      const remaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);

      if (remaining <= 0) {
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

  // 🚨 終極防線：若處於維護模式且倒數已結束，強制全螢幕阻斷
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
      {/* ⚠️ 30 秒預警通知 */}
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
                <DraggableFloatingCapsule
                  countdown={countdown}
                  onExpand={() => setIsMinimized(false)}
                />
              ) : (
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
                        <button
                          type="button"
                          onClick={handleImmediateSwitch}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
                        >
                          立即切換
                        </button>

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
