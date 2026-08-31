'use client';

import React from 'react';
import { Key, ExternalLink, CheckCircle2 } from 'lucide-react';

interface AiScannerApiKeyDrawerProps {
  showKeyDrawer: boolean;
  customApiKey: string;
  setCustomApiKey: (key: string) => void;
  onSaveApiKey: () => void;
  keySavedToast: boolean;
}

export function AiScannerApiKeyDrawer({
  showKeyDrawer,
  customApiKey,
  setCustomApiKey,
  onSaveApiKey,
  keySavedToast,
}: AiScannerApiKeyDrawerProps) {
  if (!showKeyDrawer) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-900/90 p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-top duration-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-sky-500" />
            <span>設定 Google Gemini API Key（免費額度可用）</span>
          </h5>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            若伺服端未設定環境變數，您可在此直接貼上金鑰，將安全保存在本機瀏覽器中。
          </p>
        </div>
        <a
          href="https://aistudio.google.com/"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0"
        >
          <span>30秒免費取得</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="password"
          value={customApiKey}
          onChange={(e) => setCustomApiKey(e.target.value)}
          placeholder="貼上您的 Gemini API Key (AIzaSy...)"
          className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
        <button
          type="button"
          onClick={onSaveApiKey}
          className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
        >
          儲存金鑰
        </button>
      </div>
      {keySavedToast && (
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>金鑰已成功儲存於瀏覽器！</span>
        </span>
      )}
    </div>
  );
}
