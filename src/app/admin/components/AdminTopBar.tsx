'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, BellOff, Volume2, VolumeX, Settings, Monitor, Smartphone, Sun, Moon, Store, LogOut } from 'lucide-react';

interface AdminTopBarProps {
  isSoundEnabled: boolean;
  handleToggleSound: () => void;
  isSpeechEnabled: boolean;
  isSpeaking: boolean;
  toggleSpeech: () => boolean;
  onOpenVoiceSettings: () => void;
  viewMode: 'desktop' | 'mobile';
  handleToggleViewMode: (mode: 'desktop' | 'mobile') => void;
  theme: string;
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  handleLogout: () => void;
  showToast: (msg: string) => void;
}

export default function AdminTopBar({
  isSoundEnabled,
  handleToggleSound,
  isSpeechEnabled,
  isSpeaking,
  toggleSpeech,
  onOpenVoiceSettings,
  viewMode,
  handleToggleViewMode,
  theme,
  toggleTheme,
  handleLogout,
  showToast,
}: AdminTopBarProps) {
  return (
    <div className="bg-white/85 dark:bg-[#070B14]/85 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/80 sticky top-0 z-40 px-4 py-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* 左側標題 */}
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>團長主控台</span>
          </h1>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            即時連線中
          </span>
        </div>

        {/* 右側工具操作區 (音效切換、語音報單切換、版面切換、主題切換、登出) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. 🔔 新訂單接單叮咚音效開關 */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-2 rounded-2xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isSoundEnabled
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800/70 shadow-sky-500/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title={isSoundEnabled ? '已開啟接單叮咚音效 (點擊關閉)' : '已關閉接單叮咚音效 (點擊開啟)'}
          >
            {isSoundEnabled ? <Bell className="w-4 h-4 text-sky-500" /> : <BellOff className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline font-black">{isSoundEnabled ? '音效開啟' : '音效關閉'}</span>
          </button>

          {/* 2. 🗣️ 新訂單語音詳細報單開關 + ⚙️ 設定選單 */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                const next = toggleSpeech();
                showToast(next ? '已開啟新訂單語音報單' : '已關閉新訂單語音報單');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isSpeechEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={isSpeechEnabled ? '已開啟新訂單語音詳細報單 (點擊關閉)' : '已關閉語音報單 (點擊開啟)'}
            >
              {isSpeechEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline font-black">{isSpeechEnabled ? '語音報單' : '語音關閉'}</span>
              {isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />}
            </button>
            <button
              type="button"
              onClick={onOpenVoiceSettings}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
              title="語音報單進階設定與試聽"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. 版面檢視切換 (電腦版雙欄 / 手機版單欄) */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
            <button
              type="button"
              onClick={() => handleToggleViewMode('desktop')}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="寬螢幕雙欄檢視 (推薦電腦使用)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('mobile')}
              className={`px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="單欄緊湊檢視 (推薦手機使用)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. 深淺色主題切換 */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className="p-2 rounded-2xl font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95"
            title={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
            aria-label={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* 5. 前台大廳入口 */}
          <Link
            href="/"
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-2xl font-black text-xs transition active:scale-95 shadow-2xs flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            <span>前台大廳</span>
          </Link>

          {/* 6. 安全登出 */}
          <button
            type="button"
            onClick={handleLogout}
            className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 px-3.5 py-2 rounded-2xl font-black text-xs transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出</span>
          </button>
        </div>
      </div>
    </div>
  );
}
