'use client';

import React from 'react';
import { BarChart3, UtensilsCrossed, Archive, Wrench } from 'lucide-react';

interface AdminMobileBottomNavProps {
  activeTab: 'active' | 'crud' | 'archive' | 'maintenance';
  setActiveTab: (tab: 'active' | 'crud' | 'archive' | 'maintenance') => void;
  activeSubmissionsCount: number;
}

export function AdminMobileBottomNav({
  activeTab,
  setActiveTab,
  activeSubmissionsCount,
}: AdminMobileBottomNavProps) {
  const tabs = [
    {
      id: 'active' as const,
      label: '即時對帳',
      icon: BarChart3,
      badge: activeSubmissionsCount > 0 ? activeSubmissionsCount : null,
    },
    {
      id: 'crud' as const,
      label: '菜單管理',
      icon: UtensilsCrossed,
    },
    {
      id: 'archive' as const,
      label: '歷史歸檔',
      icon: Archive,
    },
    {
      id: 'maintenance' as const,
      label: '系統維護',
      icon: Wrench,
    },
  ];

  return (
    <nav
      aria-label="團長後台手機底部導覽列"
      className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)] transition-colors duration-200 safe-area-pb select-none"
    >
      <div className="flex items-center justify-around h-15 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 active:scale-90 cursor-pointer ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
              }`}
            >
              {/* 圖示與氣泡角標 */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.9]'
                  }`}
                />

                {/* 數字 Badge (即時送單筆數) */}
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3 bg-sky-500 text-white text-[10px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#070B14] shadow-xs animate-in zoom-in-50 duration-150">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* 導覽文字標籤 */}
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-black' : 'font-medium'}`}>
                {tab.label}
              </span>

              {/* 啟用中底部發光指示膠囊 */}
              {isActive && (
                <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse shadow-sm shadow-sky-500/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
