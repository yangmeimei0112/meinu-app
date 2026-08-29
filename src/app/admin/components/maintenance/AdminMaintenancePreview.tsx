'use client';

import React from 'react';
import { MaintenanceData, MaintenanceScreen } from '@/components/MaintenanceGuard';
import { Smartphone } from 'lucide-react';

interface AdminMaintenancePreviewProps {
  config: MaintenanceData;
  previewDevice: 'mobile' | 'desktop';
  setPreviewDevice: (device: 'mobile' | 'desktop') => void;
}

export function AdminMaintenancePreview({
  config,
  previewDevice,
  setPreviewDevice,
}: AdminMaintenancePreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-sky-500" />
          <span>前台維護鎖定畫面即時預覽</span>
        </h4>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer ${
              previewDevice === 'mobile'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            手機版
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice('desktop')}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer ${
              previewDevice === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            桌機版
          </button>
        </div>
      </div>

      <div
        className={`mx-auto rounded-3xl overflow-hidden border-4 border-slate-700 dark:border-slate-700 shadow-2xl bg-white dark:bg-[#0B0F17] transition-all duration-300 ${
          previewDevice === 'mobile' ? 'max-w-[360px] h-[520px]' : 'w-full h-[520px]'
        }`}
      >
        <div className="w-full h-full overflow-y-auto pointer-events-none scale-90 sm:scale-100 origin-top">
          <MaintenanceScreen data={config} isPreview={true} />
        </div>
      </div>
    </div>
  );
}
