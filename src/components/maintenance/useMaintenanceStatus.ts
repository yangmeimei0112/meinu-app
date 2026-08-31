'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { MaintenanceData } from './MaintenanceScreen';
import type { MaintenanceScope } from '@/app/api/system/maintenance/route';

const STORAGE_KEY_LOCKED = 'meinu_maintenance_locked';
const STORAGE_KEY_DATA = 'meinu_maintenance_data';
const STORAGE_KEY_DEADLINE = 'meinu_maintenance_deadline';

export function isRouteInMaintenance(pathname: string, scope?: MaintenanceScope): boolean {
  if (!pathname || pathname.startsWith('/admin')) return false; // 後台永遠不攔截
  if (!scope || scope === 'all') return true;

  if (scope === 'home') return pathname === '/';
  if (scope === 'search') return pathname === '/search' || pathname.startsWith('/search/');
  if (scope === 'stores') return pathname.startsWith('/stores/');
  if (scope === 'cart') return pathname === '/cart' || pathname.startsWith('/cart/');
  if (scope === 'checkout') return pathname === '/checkout' || pathname.startsWith('/checkout/');
  if (scope === 'my-orders') return pathname === '/my-orders' || pathname.startsWith('/my-orders/');

  return false;
}

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

// 深度比較前後兩次維護資料是否完全相同，防止無意義的 React 重新渲染
function isMaintenanceDataEqual(a: MaintenanceData | null, b: MaintenanceData | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.is_maintenance === b.is_maintenance &&
    a.scope === b.scope &&
    a.title === b.title &&
    a.message === b.message &&
    a.estimated_end_time === b.estimated_end_time &&
    a.reason === b.reason &&
    a.custom_image_url === b.custom_image_url &&
    a.updated_at === b.updated_at
  );
}

// =========================================================================
// 🌟 單例全域狀態中樞 (Singleton Global Maintenance Store)
// 解決多處重複調用 Hook 導致的定時器衝突、重複發送網路請求與 60fps 重繪閃爍問題
// =========================================================================

interface MaintenanceStoreState {
  maintenanceData: MaintenanceData | null;
  isCountDownFinished: boolean;
  countdown: number | null;
  isCenterPopup: boolean;
}

function getInitialStoreState(): MaintenanceStoreState {
  if (typeof window === 'undefined') {
    return {
      maintenanceData: null,
      isCountDownFinished: false,
      countdown: null,
      isCenterPopup: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATA) || sessionStorage.getItem(STORAGE_KEY_DATA);
    let initialData: MaintenanceData | null = null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.is_maintenance) {
        initialData = parsed;
      }
    }

    const isLocked =
      localStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
      sessionStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
      !!initialData?.is_maintenance;

    return {
      maintenanceData: initialData,
      isCountDownFinished: isLocked,
      countdown: null,
      isCenterPopup: false,
    };
  } catch {
    return {
      maintenanceData: null,
      isCountDownFinished: false,
      countdown: null,
      isCenterPopup: false,
    };
  }
}

class MaintenanceStore {
  private state: MaintenanceStoreState = getInitialStoreState();
  private listeners: Set<() => void> = new Set();
  private pollInterval: any = null;
  private countdownInterval: any = null;
  private centerPopupTimeout: any = null;
  private deadlineTimestamp: number | null = null;
  private initialCheckDone: boolean = false;
  private wasInMaintenance: boolean = false;
  private isFetching: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedDeadline = sessionStorage.getItem(STORAGE_KEY_DEADLINE) || localStorage.getItem(STORAGE_KEY_DEADLINE);
      if (savedDeadline) {
        const num = Number(savedDeadline);
        if (!isNaN(num) && num > Date.now()) {
          this.deadlineTimestamp = num;
        }
      }
    }
  }

  public getState(): MaintenanceStoreState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);

    if (this.listeners.size === 1) {
      this.startPolling();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  private setState(partial: Partial<MaintenanceStoreState>) {
    let hasChanged = false;
    const nextState = { ...this.state };

    for (const key of Object.keys(partial) as (keyof MaintenanceStoreState)[]) {
      if (key === 'maintenanceData') {
        if (!isMaintenanceDataEqual(this.state.maintenanceData, partial.maintenanceData ?? null)) {
          nextState.maintenanceData = partial.maintenanceData ?? null;
          hasChanged = true;
        }
      } else if (nextState[key] !== partial[key]) {
        (nextState as any)[key] = partial[key];
        hasChanged = true;
      }
    }

    if (hasChanged) {
      this.state = nextState;
      this.listeners.forEach((listener) => listener());
    }
  }

  public dismissCenterPopup() {
    if (this.centerPopupTimeout) {
      clearTimeout(this.centerPopupTimeout);
      this.centerPopupTimeout = null;
    }
    this.setState({ isCenterPopup: false });
  }

  public async fetchStatus(): Promise<MaintenanceData | null> {
    if (this.isFetching) return this.state.maintenanceData;
    this.isFetching = true;

    try {
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json: MaintenanceData = await res.json();
        this.handleNewData(json);
        return json;
      }
    } catch (e) {
      console.warn('[Maintenance] Polling error:', e);
    } finally {
      this.isFetching = false;
    }
    return null;
  }

  private handleNewData(json: MaintenanceData) {
    if (json.is_maintenance) {
      this.wasInMaintenance = true;

      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(json));
        sessionStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(json));
      } catch {}

      // 若為初次載入或已直接鎖定
      if (!this.initialCheckDone) {
        this.initialCheckDone = true;
        this.setState({
          maintenanceData: json,
          isCountDownFinished: true,
          countdown: null,
          isCenterPopup: false,
        });
        try {
          localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
          sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
        } catch {}
        return;
      }

      // 若正在瀏覽中且先前非維護狀態，啟動 30 秒倒數與中央醒目提醒
      if (!this.state.maintenanceData?.is_maintenance && !this.deadlineTimestamp && !this.state.isCountDownFinished) {
        const targetDeadline = Date.now() + 30000;
        this.deadlineTimestamp = targetDeadline;
        try {
          sessionStorage.setItem(STORAGE_KEY_DEADLINE, String(targetDeadline));
          localStorage.setItem(STORAGE_KEY_DEADLINE, String(targetDeadline));
        } catch {}

        this.startCountdownTimer();
        this.setState({
          maintenanceData: json,
          countdown: 30,
          isCenterPopup: true,
        });

        if (this.centerPopupTimeout) clearTimeout(this.centerPopupTimeout);
        this.centerPopupTimeout = setTimeout(() => {
          this.setState({ isCenterPopup: false });
        }, 3500);
      } else {
        this.setState({ maintenanceData: json });
      }
    } else {
      // 伺服端維護已結束
      const wasLocked =
        this.state.isCountDownFinished ||
        this.wasInMaintenance ||
        (typeof window !== 'undefined' &&
          (sessionStorage.getItem(STORAGE_KEY_LOCKED) === 'true' || localStorage.getItem(STORAGE_KEY_LOCKED) === 'true'));

      this.cleanupStorage();
      this.stopCountdownTimer();
      this.wasInMaintenance = false;
      this.initialCheckDone = true;

      if (wasLocked) {
        forceHardReloadToLatestVersion();
        return;
      }

      this.setState({
        maintenanceData: json,
        isCountDownFinished: false,
        countdown: null,
        isCenterPopup: false,
      });
    }

    this.initialCheckDone = true;
  }

  private startCountdownTimer() {
    if (this.countdownInterval) return;

    this.countdownInterval = setInterval(() => {
      if (!this.deadlineTimestamp) {
        this.stopCountdownTimer();
        return;
      }

      const remainingSecs = Math.max(0, Math.ceil((this.deadlineTimestamp - Date.now()) / 1000));
      if (remainingSecs <= 0) {
        this.stopCountdownTimer();
        this.setState({
          countdown: 0,
          isCountDownFinished: true,
          isCenterPopup: false,
        });
        try {
          sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
          localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
        } catch {}
      } else {
        this.setState({ countdown: remainingSecs });
      }
    }, 1000);
  }

  private stopCountdownTimer() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.deadlineTimestamp = null;
  }

  private cleanupStorage() {
    try {
      sessionStorage.removeItem(STORAGE_KEY_DEADLINE);
      sessionStorage.removeItem(STORAGE_KEY_LOCKED);
      sessionStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_DEADLINE);
      localStorage.removeItem(STORAGE_KEY_LOCKED);
      localStorage.removeItem(STORAGE_KEY_DATA);
    } catch {}
  }

  private startPolling() {
    if (this.pollInterval) return;

    // 立即檢查一次
    this.fetchStatus();

    // 註冊頁面可見度事件
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.onFocusOrVisible);
      document.addEventListener('visibilitychange', this.onFocusOrVisible);
    }

    // 平穩輪詢間隔 (2.5 秒)
    this.pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      this.fetchStatus();
    }, 2500);
  }

  private onFocusOrVisible = () => {
    if (typeof document !== 'undefined' && !document.hidden) {
      this.fetchStatus();
    }
  };

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onFocusOrVisible);
      document.removeEventListener('visibilitychange', this.onFocusOrVisible);
    }
  }
}

const globalMaintenanceStore = new MaintenanceStore();

// =========================================================================
// 🪝 供 React 元件使用的訂閱 Hook (Zero-flicker useMaintenanceStatus)
// =========================================================================

export function useMaintenanceStatus(currentPathname: string = '/') {
  const state = useSyncExternalStore(
    (callback) => globalMaintenanceStore.subscribe(callback),
    () => globalMaintenanceStore.getState(),
    () => ({
      maintenanceData: null,
      isCountDownFinished: false,
      countdown: null,
      isCenterPopup: false,
    })
  );

  const [checking, setChecking] = useState<boolean>(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // 訪客手動檢查狀態按鈕
  const handleManualCheck = useCallback(async () => {
    setChecking(true);
    setCheckMessage(null);
    try {
      const data = await globalMaintenanceStore.fetchStatus();
      if (data) {
        const isInMaintenance = data.is_maintenance && isRouteInMaintenance(currentPathname, data.scope);
        if (!isInMaintenance) {
          setCheckMessage('✅ 該頁面維護已完成！即將自動為您整理並載入最新版本...');
          setTimeout(() => {
            forceHardReloadToLatestVersion(currentPathname || '/');
          }, 800);
        } else {
          setCheckMessage('⏳ 系統仍在維護升級中，請稍候再試...');
        }
      } else {
        setCheckMessage('連線異常，請稍後再試');
      }
    } catch {
      setCheckMessage('連線異常，請稍後再試');
    } finally {
      setChecking(false);
    }
  }, [currentPathname]);

  const dismissCenterPopup = useCallback(() => {
    globalMaintenanceStore.dismissCenterPopup();
  }, []);

  return {
    maintenanceData: state.maintenanceData,
    checking,
    checkMessage,
    countdown: state.countdown,
    isCountDownFinished: state.isCountDownFinished,
    isCenterPopup: state.isCenterPopup,
    dismissCenterPopup,
    isMinimized,
    setIsMinimized,
    handleManualCheck,
  };
}
