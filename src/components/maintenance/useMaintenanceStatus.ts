'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MaintenanceData } from './MaintenanceScreen';

const STORAGE_KEY_LOCKED = 'meinu_maintenance_locked';
const STORAGE_KEY_DATA = 'meinu_maintenance_data';
const STORAGE_KEY_DEADLINE = 'meinu_maintenance_deadline';

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
      sessionStorage.removeItem(STORAGE_KEY_LOCKED);
      sessionStorage.removeItem(STORAGE_KEY_DATA);
      sessionStorage.removeItem(STORAGE_KEY_DEADLINE);
      localStorage.removeItem(STORAGE_KEY_LOCKED);
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_DEADLINE);
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
  // 🌟 1. 同步自 localStorage / sessionStorage 讀取維護狀態（0ms 瞬間鎖定，杜絕重整時首幀閃現前台）
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_DATA) || sessionStorage.getItem(STORAGE_KEY_DATA);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.is_maintenance) {
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  });

  const [isCountDownFinished, setIsCountDownFinished] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const isLocked =
          localStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
          sessionStorage.getItem(STORAGE_KEY_LOCKED) === 'true';
        if (isLocked) return true;

        const raw = localStorage.getItem(STORAGE_KEY_DATA) || sessionStorage.getItem(STORAGE_KEY_DATA);
        if (raw) {
          const parsed = JSON.parse(raw);
          // 🛡️ 若系統處於維護中且使用者重整頁面，立即視為倒數已結束直接鎖定全螢幕！
          if (parsed && parsed.is_maintenance) {
            return true;
          }
        }
      } catch {}
    }
    return false;
  });

  const [checking, setChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [smoothProgress, setSmoothProgress] = useState<number>(100);
  const [isCenterPopup, setIsCenterPopup] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const initialCheckDoneRef = useRef<boolean>(false);
  const deadlineRef = useRef<number | null>(null);
  const wasInMaintenanceRef = useRef<boolean>(false);

  // 2. 輪詢查詢伺服端維護狀態
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json: MaintenanceData = await res.json();

        if (json.is_maintenance) {
          wasInMaintenanceRef.current = true;

          try {
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(json));
            sessionStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(json));
          } catch {}

          // 🛡️ 關鍵防禦：若使用者是剛進入網站或「重新載入 (Reload) 頁面」，直接鎖定全螢幕，絕不重新給 30 秒倒數繞過！
          if (!initialCheckDoneRef.current) {
            setIsCountDownFinished(true);
            setCountdown(null);
            try {
              localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
              sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
            } catch {}
          } else if (!maintenanceData?.is_maintenance && !deadlineRef.current) {
            // 只有在使用者「已經在線且原本非維護」，後台突然開啟維護時，才提供 30 秒緩衝倒數
            const targetDeadline = Date.now() + 30000;
            deadlineRef.current = targetDeadline;
            try {
              sessionStorage.setItem(STORAGE_KEY_DEADLINE, String(targetDeadline));
              localStorage.setItem(STORAGE_KEY_DEADLINE, String(targetDeadline));
            } catch {}

            setCountdown(30);
            setSmoothProgress(100);
            setIsCenterPopup(true);

            setTimeout(() => {
              setIsCenterPopup(false);
            }, 3000);
          }

          setMaintenanceData(json);
        } else {
          // 伺服端已關閉維護模式
          const wasActuallyLocked =
            sessionStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
            localStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
            (wasInMaintenanceRef.current && isCountDownFinished);

          try {
            sessionStorage.removeItem(STORAGE_KEY_DEADLINE);
            sessionStorage.removeItem(STORAGE_KEY_LOCKED);
            sessionStorage.removeItem(STORAGE_KEY_DATA);
            localStorage.removeItem(STORAGE_KEY_DEADLINE);
            localStorage.removeItem(STORAGE_KEY_LOCKED);
            localStorage.removeItem(STORAGE_KEY_DATA);
          } catch {}

          if (wasActuallyLocked) {
            wasInMaintenanceRef.current = false;
            deadlineRef.current = null;
            forceHardReloadToLatestVersion();
            return json;
          }

          wasInMaintenanceRef.current = false;
          deadlineRef.current = null;
          setCountdown(null);
          setSmoothProgress(100);
          setIsCountDownFinished(false);
          setIsCenterPopup(false);
          setIsMinimized(false);
          setMaintenanceData(json);
        }

        initialCheckDoneRef.current = true;
        return json;
      }
    } catch (e) {
      console.error('查詢維護狀態失敗', e);
    }
    return null;
  }, [isCountDownFinished, maintenanceData]);

  // 3. 背景定時輪詢 (每 3 秒檢查一次)
  useEffect(() => {
    fetchMaintenanceStatus();
    const timer = setInterval(() => {
      fetchMaintenanceStatus();
    }, 3000);
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
          sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
          localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
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
          setIsCountDownFinished(true);
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
