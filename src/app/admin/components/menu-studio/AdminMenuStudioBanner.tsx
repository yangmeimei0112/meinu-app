'use client';

import React from 'react';
import type { Store } from '@/types/database';
import {
  ChevronLeft,
  Store as StoreIcon,
  Pencil,
  Download,
  Plus,
} from 'lucide-react';

interface AdminMenuStudioBannerProps {
  activeStudioStore: Store;
  categoryName: string;
  orderedItemsCount: number;
  activeItemCount: number;
  onBackToHub: () => void;
  onEditStore: (store: Store) => void;
  onCreateMenuItem: () => void;
  onOpenBatchImportModal?: () => void;
}

export function AdminMenuStudioBanner({
  activeStudioStore,
  categoryName,
  orderedItemsCount,
  activeItemCount,
  onBackToHub,
  onEditStore,
  onCreateMenuItem,
  onOpenBatchImportModal,
}: AdminMenuStudioBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100/90 dark:border-sky-900/40 pb-4 pl-2">
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onBackToHub}
          className="inline-flex items-center gap-1.5 text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition group mb-1 cursor-pointer bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-sky-100 dark:border-slate-700 shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>返回店家列表</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {activeStudioStore.image_url ? (
              <img
                src={activeStudioStore.image_url}
                alt={activeStudioStore.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <StoreIcon className="w-7 h-7 text-sky-400 stroke-[1.8]" />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>{activeStudioStore.name}</span>
              <span className="text-xs bg-slate-900 text-white dark:bg-sky-500 font-mono font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                {activeStudioStore.code || 'S-001'}
              </span>
              <span className="text-xs bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
                {categoryName}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              專屬菜單設計工作室 &bull; 共 {orderedItemsCount} 道餐點 ({activeItemCount} 道上架中)
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap pl-2 sm:pl-0">
        <button
          type="button"
          onClick={() => onEditStore(activeStudioStore)}
          className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>店家資料</span>
        </button>

        {onOpenBatchImportModal && (
          <button
            type="button"
            onClick={onOpenBatchImportModal}
            className="bg-white/90 dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-black px-3.5 py-2 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 transition active:scale-95 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯入 CSV</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCreateMenuItem}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-black px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新增餐點品項</span>
        </button>
      </div>
    </div>
  );
}
