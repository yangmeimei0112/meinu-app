'use client';

import React from 'react';
import { BarChart3, UtensilsCrossed, Archive, Wrench, Activity } from 'lucide-react';

interface AdminTabsNavProps {
  activeTab: 'active' | 'crud' | 'archive' | 'maintenance' | 'observability';
  setActiveTab: (tab: 'active' | 'crud' | 'archive' | 'maintenance' | 'observability') => void;
  activeSubmissionsCount: number;
}

export default function AdminTabsNav({
  activeTab,
  setActiveTab,
  activeSubmissionsCount,
}: AdminTabsNavProps) {
  return (
    <div className="hidden sm:block max-w-7xl mx-auto w-full px-4 pt-4">
      <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-[#0E1726]/90 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-800 overflow-x-auto shadow-inner">
        {/* 1. 即時對帳 */}
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>即時對帳</span>
          {activeSubmissionsCount > 0 && (
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-black transition-colors ${
                activeTab === 'active'
                  ? 'bg-sky-500 text-white dark:bg-white dark:text-sky-900 shadow-2xs'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80'
              }`}
            >
              {activeSubmissionsCount}
            </span>
          )}
        </button>

        {/* 2. 店家與菜單管理 */}
        <button
          type="button"
          onClick={() => setActiveTab('crud')}
          className={`flex-1 min-w-[115px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'crud'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>菜單工作室</span>
        </button>

        {/* 3. 歷史歸檔 */}
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'archive'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>歷史歸檔</span>
        </button>

        {/* 4. 系統維護 */}
        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>系統維護</span>
        </button>

        {/* 5. 🚀 全景動態觀測中心 */}
        <button
          type="button"
          onClick={() => setActiveTab('observability')}
          className={`flex-1 min-w-[115px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'observability'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 animate-pulse" />
          <span>動態觀測中心</span>
        </button>
      </div>
    </div>
  );
}
