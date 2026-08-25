'use client';

import React from 'react';

interface AdminTabsNavProps {
  activeTab: 'active' | 'crud' | 'archive' | 'maintenance';
  setActiveTab: (tab: 'active' | 'crud' | 'archive' | 'maintenance') => void;
  activeSubmissionsCount: number;
}

export default function AdminTabsNav({
  activeTab,
  setActiveTab,
  activeSubmissionsCount,
}: AdminTabsNavProps) {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 pt-4">
      <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-[#0E1726]/90 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-800 overflow-x-auto shadow-inner">
        {/* 1. 即時對帳 */}
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 min-w-[105px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>📊 即時對帳</span>
          {activeSubmissionsCount > 0 && (
            <span className="bg-sky-500 dark:bg-white text-white dark:text-sky-800 text-[10px] px-2 py-0.2 rounded-full font-black">
              {activeSubmissionsCount}
            </span>
          )}
        </button>

        {/* 2. 店家與菜單管理 */}
        <button
          type="button"
          onClick={() => setActiveTab('crud')}
          className={`flex-1 min-w-[125px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'crud'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🍽️ 店家與菜單工作室</span>
        </button>

        {/* 3. 歷史歸檔 */}
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`flex-1 min-w-[105px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'archive'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🗄️ 歷史訂單歸檔</span>
        </button>

        {/* 4. 系統維護 */}
        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 min-w-[105px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>🛠️ 系統維護模式</span>
        </button>
      </div>
    </div>
  );
}
