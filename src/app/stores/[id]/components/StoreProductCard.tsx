'use client';

import React from 'react';
import { MenuItem } from '@/types/database';

interface StoreProductCardProps {
  item: MenuItem;
  popularQty: number;
  onSelect: (item: MenuItem) => void;
}

export default function StoreProductCard({ item, popularQty, onSelect }: StoreProductCardProps) {
  const isSoldOut = item.is_sold_out;

  return (
    <div
      onClick={() => {
        if (!isSoldOut) onSelect(item);
      }}
      className={`bg-white dark:bg-[#131B2B] rounded-3xl p-4 border shadow-xs transition flex items-center justify-between gap-3 content-auto ${
        isSoldOut
          ? 'border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
          : 'border-slate-100 dark:border-slate-800/80 hover:border-sky-200 dark:hover:border-sky-500/40 cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.name}</h4>
          {isSoldOut && (
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              已售完
            </span>
          )}
          {popularQty > 0 && (
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              🔥 本團已點 {popularQty} 份
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-2">{item.description}</p>
        )}
        <p className="text-sm font-extrabold text-sky-600 dark:text-sky-400">${item.price} 元</p>
      </div>

      <button
        type="button"
        disabled={isSoldOut}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 border ${
          isSoldOut
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            : 'bg-sky-50 dark:bg-slate-800 hover:bg-sky-500 dark:hover:bg-sky-600 text-sky-600 dark:text-sky-300 hover:text-white border-sky-200 dark:border-slate-700 cursor-pointer'
        }`}
      >
        {isSoldOut ? '已售完' : '選購 +'}
      </button>
    </div>
  );
}
