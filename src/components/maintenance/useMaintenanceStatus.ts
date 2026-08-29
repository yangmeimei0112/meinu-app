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
    // 🛡️ 徹底防護：禁止對管理後台 (/admin) 執行任何強制重整
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }
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
            // 只有在使用者確實處於維護鎖定畫面時，解除維護才需要重整恢復前台
            const wasActuallyLocked =
              sessionStorage.getItem('meinu_maintenance_locked') === 'true' ||
              (wasInMaintenanceRef.current && isCountDownFinished);

            if (wasActuallyLocked) {
              wasInMaintenanceRef.current = false;
              deadlineRef.current = null;
              try {
                sessionStorage.removeItem('meinu_maintenance_deadline');
                sessionStorage.removeItem('meinu_maintenance_locked');
              } catch {}
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
  }, [isCountDownFinished]);

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
      const remainingMs = deadlineRef.current - Date.now();
      if (remainingMs <= 0) {
        setSmoothProgress(0);
        setCountdown(0);
        setIsCountDownFinished(true);
        wasInMaintenanceRef.current = true;
        try {
          sessionStorage.setItem('meinu_maintenance_locked', 'true');
        } catch {}
        return;
      }
      const progressPercent = (remainingMs / 30000) * 100;
      setSmoothProgress(Math.max(0, Math.min(100, progressPercent)));
      setCountdown(Math.ceil(remainingMs / 1000));
      animId = requestAnimationFrame(updateSmoothProgress);
    };

    animId = requestAnimationFrame(updateSmoothProgress);
    return () => cancelAnimationFrame(animId);
  }, [countdown]);

  // 5. 訪客於鎖定畫面點擊「立即重試」
  const handleManualCheck = async () => {
    setChecking(true);
    setCheckMessage(null);
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json: MaintenanceData = await res.json();
        if (!json.is_maintenance) {
          setCheckMessage('✅ 網站維護已完成！即將自動為您整理並載入最新版本...');
          setTimeout(() => {
            forceHardReloadToLatestVersion('/');
          }, 800);
          return;
        } else {
          setCheckMessage('⏳ 系統仍在維護升級中，請稍候再試...');
          setMaintenanceData(json);
        }
      } else {
        setCheckMessage('連線異常，請稍後再試');
      }
    } catch {
      setCheckMessage('連線異常，請稍後再試');
    } finally {
      setChecking(false);
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
