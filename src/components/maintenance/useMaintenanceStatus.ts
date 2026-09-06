'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { MaintenanceData } from './MaintenanceScreen';
import type { MaintenanceScope } from '@/lib/maintenanceConfig';

export type MaintenanceLifecycleState = 'NORMAL' | 'GRACE_PERIOD' | 'LOCKED' | 'RESTORING';

const STORAGE_KEY_LOCKED = 'meinu_maintenance_locked';
const STORAGE_KEY_DATA = 'meinu_maintenance_data';
const STORAGE_KEY_DEADLINE = 'meinu_maintenance_deadline';
const STORAGE_KEY_RESTORED_EPOCH = 'meinu_maintenance_restored_epoch';

export function isRouteInMaintenance(
  pathname: string,
  scope?: MaintenanceScope,
  scopes?: MaintenanceScope[]
): boolean {
  if (!pathname || pathname.startsWith('/admin')) return false; // 後台永遠不攔截

  // 優先採用複選 scopes 陣列，若無則兼容舊版單選 scope
  const activeScopes: MaintenanceScope[] =
    scopes && Array.isArray(scopes) && scopes.length > 0
      ? scopes
      : scope
      ? [scope]
      : ['all'];

  if (activeScopes.includes('all')) return true;

  return activeScopes.some((s) => {
    if (s === 'home') return pathname === '/';
    if (s === 'search') return pathname === '/search' || pathname.startsWith('/search/');
    if (s === 'stores') return pathname.startsWith('/stores/');
    if (s === 'cart') return pathname === '/cart' || pathname.startsWith('/cart/');
    if (s === 'checkout') return pathname === '/checkout' || pathname.startsWith('/checkout/');
    if (s === 'my-orders') return pathname === '/my-orders' || pathname.startsWith('/my-orders/');
    if (s === 'account') return pathname === '/account' || pathname.startsWith('/account/');
    if (s === 'legal') {
      return (
        pathname.startsWith('/legal') ||
        pathname === '/terms' ||
        pathname === '/privacy' ||
        pathname === '/user-terms' ||
        pathname === '/security'
      );
    }
    return false;
  });
}

// 🧹 原子化強制清理所有快取並帶隨機時間戳硬重整至最新版本（防止重整死鎖）
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
    // 🛡️ 僅在明確指定不允許重整後台（如維護結束自動輪詢時），且當前位於管理後台時略過
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

// 深度比較前後兩次維護資料是否完全相同，防止無意義的 React 重新渲染
function isMaintenanceDataEqual(a: MaintenanceData | null, b: MaintenanceData | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const scopesEqual =
    JSON.stringify(a.scopes || (a.scope ? [a.scope] : ['all'])) ===
    JSON.stringify(b.scopes || (b.scope ? [b.scope] : ['all']));

  return (
    a.is_maintenance === b.is_maintenance &&
    a.scope === b.scope &&
    scopesEqual &&
    a.title === b.title &&
    a.message === b.message &&
    a.estimated_end_time === b.estimated_end_time &&
    a.reason === b.reason &&
    a.custom_image_url === b.custom_image_url &&
    a.updated_at === b.updated_at &&
    a.activated_at === b.activated_at &&
    a.epoch === b.epoch
  );
}

// =========================================================================
// 🌟 單例全域狀態中樞 (Deterministic Singleton Maintenance Store)
// 狀態機生命週期：NORMAL ➔ GRACE_PERIOD (30s) ➔ LOCKED ➔ RESTORING
// =========================================================================

interface MaintenanceStoreState {
  lifecycleState: MaintenanceLifecycleState;
  maintenanceData: MaintenanceData | null;
  isCountDownFinished: boolean;
  countdown: number | null;
  isCenterPopup: boolean;
}

function calculateGraceRemaining(activatedAtStr?: string, updatedAtStr?: string): number {
  const tsStr = activatedAtStr || updatedAtStr;
  if (!tsStr) return 0;
  const activatedTime = new Date(tsStr).getTime();
  if (isNaN(activatedTime) || activatedTime <= 0) return 0;
  const elapsedSecs = Math.max(0, Math.floor((Date.now() - activatedTime) / 1000));
  return Math.max(0, 30 - elapsedSecs);
}

function getInitialStoreState(serverData?: MaintenanceData | null): MaintenanceStoreState {
  if (typeof window === 'undefined') {
    if (!serverData?.is_maintenance) {
      return {
        lifecycleState: 'NORMAL',
        maintenanceData: serverData || null,
        isCountDownFinished: false,
        countdown: null,
        isCenterPopup: false,
      };
    }
    const remainingGrace = calculateGraceRemaining(serverData.activated_at, serverData.updated_at);
    const isLocked = remainingGrace <= 0;
    return {
      lifecycleState: isLocked ? 'LOCKED' : 'GRACE_PERIOD',
      maintenanceData: serverData,
      isCountDownFinished: isLocked,
      countdown: isLocked ? null : remainingGrace,
      isCenterPopup: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_DATA) || sessionStorage.getItem(STORAGE_KEY_DATA);
    let initialData: MaintenanceData | null = serverData || null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          initialData = parsed;
        }
      } catch {}
    }

    if (!initialData?.is_maintenance) {
      return {
        lifecycleState: 'NORMAL',
        maintenanceData: initialData,
        isCountDownFinished: false,
        countdown: null,
        isCenterPopup: false,
      };
    }

    const remainingGrace = calculateGraceRemaining(initialData.activated_at, initialData.updated_at);
    const isLocked =
      remainingGrace <= 0 ||
      localStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
      sessionStorage.getItem(STORAGE_KEY_LOCKED) === 'true';

    return {
      lifecycleState: isLocked ? 'LOCKED' : 'GRACE_PERIOD',
      maintenanceData: initialData,
      isCountDownFinished: isLocked,
      countdown: isLocked ? null : remainingGrace,
      isCenterPopup: false,
    };
  } catch {
    return {
      lifecycleState: 'NORMAL',
      maintenanceData: serverData || null,
      isCountDownFinished: Boolean(serverData?.is_maintenance),
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
  private initialCheckDone: boolean = false;
  private wasInMaintenance: boolean = false;
  private isFetching: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if (this.state.lifecycleState === 'GRACE_PERIOD' && (this.state.countdown ?? 0) > 0) {
        this.startCountdownTicker();
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

  public seedServerData(serverData: MaintenanceData) {
    if (serverData.is_maintenance) {
      this.wasInMaintenance = true;
      this.initialCheckDone = true;

      const remainingGrace = calculateGraceRemaining(serverData.activated_at, serverData.updated_at);
      const isLocked = remainingGrace <= 0;

      this.setState({
        lifecycleState: isLocked ? 'LOCKED' : 'GRACE_PERIOD',
        maintenanceData: serverData,
        isCountDownFinished: isLocked,
        countdown: isLocked ? 0 : remainingGrace,
        isCenterPopup: false,
      });

      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(serverData));
        sessionStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(serverData));
        if (isLocked) {
          localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
          sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
        }
      } catch {}

      if (!isLocked && remainingGrace > 0) {
        this.startCountdownTicker();
      }
    }
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
      const remainingGrace = calculateGraceRemaining(json.activated_at, json.updated_at);
      const isNewlyTriggered =
        !this.wasInMaintenance && !this.state.isCountDownFinished && this.initialCheckDone;

      this.wasInMaintenance = true;

      try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(json));
        sessionStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(json));
      } catch {}

      if (remainingGrace > 0) {
        // 在 30 秒過渡緩衝期內
        this.startCountdownTicker();

        const shouldShowPopup = isNewlyTriggered;
        this.setState({
          lifecycleState: 'GRACE_PERIOD',
          maintenanceData: json,
          isCountDownFinished: false,
          countdown: remainingGrace,
          isCenterPopup: shouldShowPopup,
        });

        if (shouldShowPopup) {
          if (this.centerPopupTimeout) clearTimeout(this.centerPopupTimeout);
          this.centerPopupTimeout = setTimeout(() => {
            this.setState({ isCenterPopup: false });
          }, 3500);
        }
      } else {
        // 緩衝期已過，立即進入鎖定狀態 (0s grace)
        this.stopCountdownTicker();
        this.setState({
          lifecycleState: 'LOCKED',
          maintenanceData: json,
          isCountDownFinished: true,
          countdown: 0,
          isCenterPopup: false,
        });

        try {
          localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
          sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
        } catch {}
      }
    } else {
      // 伺服端維護已結束 (is_maintenance: false)
      const wasLockedOrInMaint =
        this.state.lifecycleState === 'LOCKED' ||
        this.state.lifecycleState === 'GRACE_PERIOD' ||
        this.state.isCountDownFinished ||
        this.wasInMaintenance ||
        (typeof window !== 'undefined' &&
          (sessionStorage.getItem(STORAGE_KEY_LOCKED) === 'true' ||
            localStorage.getItem(STORAGE_KEY_LOCKED) === 'true'));

      this.cleanupStorage();
      this.stopCountdownTicker();
      this.wasInMaintenance = false;
      this.initialCheckDone = true;

      if (wasLockedOrInMaint) {
        // 檢查此世代是否已執行過重整，防止快取競態死鎖
        const epochKey = String(json.epoch || Date.now());
        let alreadyRestored = false;
        try {
          if (sessionStorage.getItem(STORAGE_KEY_RESTORED_EPOCH) === epochKey) {
            alreadyRestored = true;
          } else {
            sessionStorage.setItem(STORAGE_KEY_RESTORED_EPOCH, epochKey);
          }
        } catch {}

        if (!alreadyRestored) {
          this.setState({
            lifecycleState: 'RESTORING',
            maintenanceData: json,
            isCountDownFinished: false,
            countdown: null,
            isCenterPopup: false,
          });
          forceHardReloadToLatestVersion(undefined, { allowAdmin: false });
          return;
        }
      }

      this.setState({
        lifecycleState: 'NORMAL',
        maintenanceData: json,
        isCountDownFinished: false,
        countdown: null,
        isCenterPopup: false,
      });
    }

    this.initialCheckDone = true;
  }

  private startCountdownTicker() {
    if (this.countdownInterval) return;

    this.countdownInterval = setInterval(() => {
      const data = this.state.maintenanceData;
      if (!data?.is_maintenance) {
        this.stopCountdownTicker();
        return;
      }

      const remainingSecs = calculateGraceRemaining(data.activated_at, data.updated_at);
      if (remainingSecs <= 0) {
        this.stopCountdownTicker();
        this.setState({
          lifecycleState: 'LOCKED',
          countdown: 0,
          isCountDownFinished: true,
          isCenterPopup: false,
        });
        try {
          sessionStorage.setItem(STORAGE_KEY_LOCKED, 'true');
          localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
        } catch {}
      } else {
        this.setState({
          lifecycleState: 'GRACE_PERIOD',
          countdown: remainingSecs,
        });
      }
    }, 1000);
  }

  private stopCountdownTicker() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
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
// 🪝 供 React 元件使用的訂閱 Hook (Deterministic useMaintenanceStatus)
// =========================================================================

export function useMaintenanceStatus(currentPathname: string = '/', initialData?: MaintenanceData | null) {
  useEffect(() => {
    if (initialData?.is_maintenance && !globalMaintenanceStore.getState().maintenanceData?.is_maintenance) {
      globalMaintenanceStore.seedServerData(initialData);
    }
  }, [initialData]);

  const state = useSyncExternalStore(
    (callback) => globalMaintenanceStore.subscribe(callback),
    () => globalMaintenanceStore.getState(),
    () => {
      const remainingGrace = initialData?.is_maintenance
        ? calculateGraceRemaining(initialData.activated_at, initialData.updated_at)
        : 0;
      const isLocked = Boolean(initialData?.is_maintenance && remainingGrace <= 0);
      return {
        lifecycleState: !initialData?.is_maintenance
          ? 'NORMAL'
          : isLocked
          ? 'LOCKED'
          : 'GRACE_PERIOD',
        maintenanceData: initialData || null,
        isCountDownFinished: isLocked,
        countdown: initialData?.is_maintenance && !isLocked ? remainingGrace : null,
        isCenterPopup: false,
      };
    }
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
        const isInMaintenance =
          data.is_maintenance && isRouteInMaintenance(currentPathname, data.scope, data.scopes);
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
    state: state.lifecycleState,
    lifecycleState: state.lifecycleState,
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
