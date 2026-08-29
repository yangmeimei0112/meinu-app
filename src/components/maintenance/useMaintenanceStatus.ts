'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MaintenanceData } from './MaintenanceScreen';

// 🧹 強制清除所有快取並帶隨機時間戳硬重整至最新版本
export async function forceHardReloadToLatestVersion(targetUrl?: string) {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('meinu_maintenance_locked');
      sessionStorage.removeItem('meinu_maintenance_deadline');
    }
  } catch (e) {
    console.error('快取清理出錯:', e);
  }

  if (typeof window !== 'undefined') {
    const url = new URL(targetUrl || window.location.href);
    url.searchParams.set('_update', String(Date.now()));
    window.location.replace(url.toString());
  }
}

export function useMaintenanceStatus() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [smoothProgress, setSmoothProgress] = useState<number>(100);
  const [isCountDownFinished, setIsCountDownFinished] = useState<boolean>(false);
  const [isCenterPopup, setIsCenterPopup] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const initialCheckDoneRef = useRef<boolean>(false);
  const deadlineRef = useRef<number | null>(null);
  const wasInMaintenanceRef = useRef<boolean>(false);
  const initialClientBuildRef = useRef<string>(process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'dev');

  // 1. 初始化讀取 SessionStorage
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

  // 2. 輪詢查詢伺服端維護狀態
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json: MaintenanceData = await res.json();
        setMaintenanceData((prev) => {
          if (json.is_maintenance) {
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

  // 3. 背景定時輪詢
  useEffect(() => {
    fetchMaintenanceStatus();
    const timer = setInterval(() => {
      fetchMaintenanceStatus();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchMaintenanceStatus]);

  // 4. 60fps 平滑進度條
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

  // 5. 倒數計時器
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
        setCheckMessage('🎉 系統維護已結束！正在為您重新整理載入最新版本...');
        setTimeout(() => {
          forceHardReloadToLatestVersion('/');
        }, 800);
      } else {
        setCheckMessage('🔧 系統仍在維護進行中，請稍候重試。');
      }
    } else {
      setCheckMessage('⚠️ 連線檢查失敗，請確認網路連線。');
    }
  };

  return {
    maintenanceData,
    checking,
    checkMessage,
    countdown,
    smoothProgress,
    isCountDownFinished,
    isCenterPopup,
    isMinimized,
    setIsMinimized,
    handleManualCheck,
  };
}
