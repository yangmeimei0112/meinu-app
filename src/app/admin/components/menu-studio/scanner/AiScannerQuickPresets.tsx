'use client';

import React from 'react';
import { Zap, Coffee, UtensilsCrossed } from 'lucide-react';

interface AiScannerQuickPresetsProps {
  onLoadMockData: (type: 'beverage' | 'bento') => void;
}

export function AiScannerQuickPresets({ onLoadMockData }: AiScannerQuickPresetsProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>模擬測試與示範載入（免拍菜單立即試用）：</span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onLoadMockData('beverage')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
        >
          <Coffee className="w-3.5 h-3.5 text-sky-500" />
          <span>載入手搖飲料示範菜單 (50嵐/得正)</span>
        </button>

        <button
          type="button"
          onClick={() => onLoadMockData('bento')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
          <span>載入便當快餐示範菜單 (排骨/雞腿便當)</span>
        </button>
      </div>
    </div>
  );
}
