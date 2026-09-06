'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import type { MaintenanceData } from './MaintenanceScreen';
import { isRouteInMaintenance } from '@/lib/maintenanceConfig';

export { isRouteInMaintenance };

const STORAGE_KEY_SEEN_EPOCH = 'meinu_maintenance_seen_epoch';
const STORAGE_KEY_DISMISSED_POPUP = 'meinu_maintenance_popup_dismissed';

// 🧹 清理快取並安全硬重整（防範重整迴圈與後台誤傷）
export async function forceHardReloadToLatestVersion(
  targetUrl?: string,
  options: { allowAdmin?: boolean } = { allowAdmin: true }
) {
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
      sessionStorage.removeItem(STORAGE_KEY_SEEN_EPOCH);
      sessionStorage.removeItem(STORAGE_KEY_DISMISSED_POPUP);
      localStorage.removeItem(STORAGE_KEY_SEEN_EPOCH);
      localStorage.removeItem(STORAGE_KEY_DISMISSED_POPUP);
    }
  } catch (e) {
    console.error('快取清理錯誤:', e);
  }

  if (typeof window !== 'undefined') {
    if (!options.allowAdmin && window.location.pathname.startsWith('/admin')) {
      return;
    }
    try {
      const url = new URL(targetUrl || window.location.href, window.location.origin);
      url.searchParams.set('_v_update', String(Date.now()));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  }
}

// =========================================================================
// 🌟 單例全域狀態機中樞 (Singleton Global Maintenance Store)
// =========================================================================

interface MaintenanceStoreState {
  maintenanceData: MaintenanceData | null;
  countdown: number | null;
  isCountDownFinished: boolean;
  isCenterPopup: boolean;
  isMinimized: boolean;
  checking: boolean;
  checkMessage: string | null;
}

let storeState: MaintenanceStoreState = {
  maintenanceData: null,
  countdown: null,
  isCountDownFinished: false,
  isCenterPopup: false,
  isMinimized: false,
  checking: false,
  checkMessage: null,
};

const listeners = new Set<() => void>();
let countdownTimer: NodeJS.Timeout | null = null;
let isInitialized = false;

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdown(initialSeconds: number) {
  stopCountdown();
  storeState = {
    ...storeState,
    countdown: initialSeconds,
    isCountDownFinished: initialSeconds <= 0,
    isCenterPopup: initialSeconds > 0,
  };
  emitChange();

  if (initialSeconds <= 0) return;

  countdownTimer = setInterval(() => {
    if (storeState.countdown === null || storeState.countdown <= 1) {
      stopCountdown();
      storeState = {
        ...storeState,
        countdown: 0,
        isCountDownFinished: true,
        isCenterPopup: false,
      };
      emitChange();
    } else {
      storeState = {
        ...storeState,
        countdown: storeState.countdown - 1,
      };
      emitChange();
    }
  }, 1000);
}

function applyServerConfig(incoming: MaintenanceData) {
  const prev = storeState.maintenanceData;

  // 1. 維護模式開啟
  if (incoming.is_maintenance) {
    const isNewEpoch = !prev || !prev.is_maintenance || (incoming.epoch && incoming.epoch !== prev.epoch);

    storeState = {
      ...storeState,
      maintenanceData: incoming,
      checkMessage: null,
    };

    if (isNewEpoch) {
      const now = Date.now();
      const activatedAtMs = incoming.activated_at ? new Date(incoming.activated_at).getTime() : now;
      const elapsedSeconds = Math.max(0, Math.floor((now - activatedAtMs) / 1000));
      const remainingGrace = Math.max(0, 30 - elapsedSeconds);

      if (remainingGrace > 0) {
        startCountdown(remainingGrace);
      } else {
        stopCountdown();
        storeState = {
          ...storeState,
          countdown: 0,
          isCountDownFinished: true,
          isCenterPopup: false,
        };
        emitChange();
      }
    } else {
      emitChange();
    }
    return;
  }

  // 2. 維護模式關閉（平滑恢復正常點餐）
  if (prev && prev.is_maintenance) {
    stopCountdown();
    storeState = {
      ...storeState,
      maintenanceData: incoming,
      countdown: null,
      isCountDownFinished: false,
      isCenterPopup: false,
      isMinimized: false,
      checkMessage: null,
    };
    emitChange();
    return;
  }

  // 3. 原本即未開啟維護
  if (!incoming.is_maintenance) {
    storeState = {
      ...storeState,
      maintenanceData: incoming,
    };
    emitChange();
  }
}

async function fetchMaintenanceStatus() {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/system/maintenance', {
      cache: 'no-store',
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data: MaintenanceData = await res.json();
      applyServerConfig(data);
    }
  } catch (err) {
    console.error('輪詢維護狀態失敗:', err);
  }
}

function initGlobalPolling() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 初次查詢
  fetchMaintenanceStatus();

  // 自適應智能輪詢（維護中時 5 秒，正常時 10 秒）
  setInterval(() => {
    fetchMaintenanceStatus();
  }, 8000);
}

// =========================================================================
// 🪝 Hook: 前台組件與守衛訂閱
// =========================================================================

export function useMaintenanceStatus(currentPathname: string, initialData?: MaintenanceData) {
  useEffect(() => {
    if (initialData) {
      applyServerConfig(initialData);
    }
    initGlobalPolling();
  }, [initialData]);

  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => storeState,
    () => ({
      maintenanceData: initialData || null,
      countdown: null,
      isCountDownFinished: Boolean(initialData?.is_maintenance),
      isCenterPopup: false,
      isMinimized: false,
      checking: false,
      checkMessage: null,
    })
  );

  const dismissCenterPopup = useCallback(() => {
    storeState = {
      ...storeState,
      isCenterPopup: false,
    };
    emitChange();
  }, []);

  const setIsMinimized = useCallback((minimized: boolean) => {
    storeState = {
      ...storeState,
      isMinimized: minimized,
    };
    emitChange();
  }, []);

  // 互動式手動「檢查維護是否已完成」
  const handleManualCheck = useCallback(async () => {
    storeState = { ...storeState, checking: true, checkMessage: null };
    emitChange();

    try {
      const res = await fetch('/api/system/maintenance', {
        cache: 'no-store',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const latest: MaintenanceData = await res.json();
        applyServerConfig(latest);

        if (!latest.is_maintenance) {
          // 維護已解除：單次平滑硬重整回最新版本
          forceHardReloadToLatestVersion();
          return;
        }

        storeState = {
          ...storeState,
          checking: false,
          checkMessage: '系統仍在進行例行升級中，請稍候片刻再試！',
        };
        emitChange();
      } else {
        storeState = {
          ...storeState,
          checking: false,
          checkMessage: '伺服端連線異常，請稍後重試。',
        };
        emitChange();
      }
    } catch {
      storeState = {
        ...storeState,
        checking: false,
        checkMessage: '網路連線失敗，請檢查網路狀態。',
      };
      emitChange();
    }
  }, []);

  return {
    maintenanceData: state.maintenanceData,
    checking: state.checking,
    checkMessage: state.checkMessage,
    countdown: state.countdown,
    isCountDownFinished: state.isCountDownFinished,
    isCenterPopup: state.isCenterPopup,
    dismissCenterPopup,
    isMinimized: state.isMinimized,
    setIsMinimized,
    handleManualCheck,
  };
}
