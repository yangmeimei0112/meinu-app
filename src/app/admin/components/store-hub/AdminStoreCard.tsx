'use client';

import React from 'react';
import type { Store } from '@/types/database';
import { Store as StoreIcon, Wrench, ArrowRight, Pencil, Trash2 } from 'lucide-react';

interface AdminStoreCardProps {
  store: Store;
  catName: string;
  storeItemCount: number;
  storeActiveCount: number;
  onSelectStudioStore: (storeId: string) => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (id: string) => void;
}

export function AdminStoreCard({
  store,
  catName,
  storeItemCount,
  storeActiveCount,
  onSelectStudioStore,
  onEditStore,
  onDeleteStore,
}: AdminStoreCardProps) {
  return (
    <div className="bg-white/95 dark:bg-[#0E1726]/95 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4 flex flex-col justify-between transition hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-lg group backdrop-blur-md">
      <div className="space-y-3.5">
        {/* 店家封面與分類標籤 */}
        <div className="flex items-start justify-between gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {store.image_url ? (
              <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <StoreIcon className="w-8 h-8 text-sky-400 stroke-[1.8]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* S-??? 商家專屬編號徽章 */}
              <span className="text-[10px] font-black font-mono bg-slate-900 text-white dark:bg-sky-500 dark:text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                {store.code || 'S-001'}
              </span>
              <span className="text-[10px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
                {catName}
              </span>
            </div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mt-1.5 truncate">
              {store.name}
            </h3>
          </div>
        </div>

        {/* 菜單規模數據膠囊 */}
        <div className="bg-slate-50 dark:bg-[#152033] p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500 dark:text-slate-400">菜單品項：</span>
          <span className="text-slate-900 dark:text-slate-100 font-black">
            共 {storeItemCount} 道餐點 ({storeActiveCount} 上架中)
          </span>
        </div>
      </div>

      {/* 操作按鈕群 */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* 核心主要 CTA：進入菜單設計 */}
        <button
          type="button"
          onClick={() => onSelectStudioStore(store.id)}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs py-2.5 rounded-2xl transition shadow-md shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>進入菜單設計</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* 次要操作 */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onEditStore(store)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            <span>編輯資料</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteStore(store.id)}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-black px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>刪除</span>
          </button>
        </div>
      </div>
    </div>
  );
}
