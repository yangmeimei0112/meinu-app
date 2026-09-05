'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw, X, ArrowRight } from 'lucide-react';
import { forceHardReloadToLatestVersion } from './maintenance/useMaintenanceStatus';

interface ServerVersionData {
  version: string;
  commitHash?: string;
  buildTime?: string;
}

const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '10.6.1';
const CLIENT_COMMIT = process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || '';
const STORAGE_KEY_SNOOZE = 'meinu_version_update_snooze';

export default function VersionUpdateModal() {
  const [hasNewVersion, setHasNewVersion] = useState<boolean>(false);
  const [serverVersion, setServerVersion] = useState<string>('');
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const isCheckingRef = useRef<boolean>(false);

  const checkVersion = useCallback(async () => {
    if (isCheckingRef.current) return;

    // 檢查是否處於使用者「稍後提醒」暫緩期內（10 分鐘）
    try {
      const snoozeUntil = localStorage.getItem(STORAGE_KEY_SNOOZE);
      if (snoozeUntil && Number(snoozeUntil) > Date.now()) {
        return;
      }
    } catch {}

    isCheckingRef.current = true;
    try {
      const res = await fetch('/api/system/version', { cache: 'no-store' });
      if (res.ok) {
        const data: ServerVersionData = await res.json();
        const sVer = data.version;
        const sHash = data.commitHash;

        const isVersionDifferent = sVer && sVer !== CLIENT_VERSION;
        const isCommitDifferent =
          sHash &&
          CLIENT_COMMIT &&
          sHash !== 'dev' &&
          CLIENT_COMMIT !== 'dev' &&
          sHash !== CLIENT_COMMIT;

        if (isVersionDifferent || isCommitDifferent) {
          setServerVersion(sVer || '最新版');
          setHasNewVersion(true);
        }
      }
    } catch {
      // 靜默捕捉，不影響使用者正常點餐
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. 初次載入延遲 3 秒檢查一次，避免阻塞首屏核心資源
    const initTimer = setTimeout(() => {
      checkVersion();
    }, 3000);

    // 2. 切換分頁回前景時檢查
    const handleFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkVersion();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 3. 背景每 45 秒輕量檢查一次
    const intervalTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      checkVersion();
    }, 45000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [checkVersion]);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      localStorage.removeItem(STORAGE_KEY_SNOOZE);
      sessionStorage.removeItem(STORAGE_KEY_SNOOZE);
    } catch {}

    try {
      await forceHardReloadToLatestVersion(undefined, { allowAdmin: true });
    } catch (err) {
      console.warn('[VersionUpdate] Reload failed, executing fallback reload:', err);
      window.location.reload();
    }

    // 保底計時器：若 500ms 內瀏覽器尚未執行跳轉，強制觸發頁面重載
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('_v_update', String(Date.now()));
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    }, 500);
  };

  const handleSnooze = () => {
    try {
      // 暫緩 10 分鐘後再次提醒
      localStorage.setItem(STORAGE_KEY_SNOOZE, String(Date.now() + 10 * 60 * 1000));
    } catch {}
    setHasNewVersion(false);
  };

  if (!hasNewVersion) return null;

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#111C38] to-[#0A0F1D] border-2 border-sky-500/70 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl shadow-sky-500/30 space-y-4 animate-in zoom-in-95 duration-200">
        {/* 背景環境流光光暈 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={handleSnooze}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
          title="稍後提醒"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 頂部火箭/新版本圖示 */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-xl shadow-sky-500/30 ring-8 ring-sky-500/10">
          <div className="w-full h-full rounded-2xl bg-[#0F172A] flex items-center justify-center text-sky-400">
            <Sparkles className="w-8 h-8 animate-pulse text-sky-300" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500" />
          </span>
        </div>

        {/* 標題與核心提示文字 */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            <span>🚀 系統發布新版本</span>
          </div>

          <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-blue-100 to-white leading-snug">
            發現更新的版本，請您重新載入頁面
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            為了確保您能正常使用最新功能與最佳的點餐效能，請點擊下方按鈕重新載入網頁。
          </p>
        </div>

        {/* 版本比較膠囊 */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 shadow-inner flex items-center justify-center gap-2 text-xs font-mono">
          <span className="text-slate-400">目前 v{CLIENT_VERSION}</span>
          <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-sky-300 font-bold">最新 v{serverVersion}</span>
        </div>

        {/* 重新載入主要按鈕 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isReloading}
            onClick={handleReload}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-sm py-3 px-5 rounded-2xl shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {/* 微光掃光動畫 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isReloading ? '正在重新載入最新版本...' : '重新載入頁面'}</span>
          </button>

          <button
            type="button"
            onClick={handleSnooze}
            className="text-xs text-slate-400 hover:text-slate-200 transition font-medium underline underline-offset-4 cursor-pointer"
          >
            稍後再說（10 分鐘後提醒）
          </button>
        </div>
      </div>
    </div>
  );
}
