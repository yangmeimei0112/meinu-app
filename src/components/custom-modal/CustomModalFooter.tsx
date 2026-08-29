'use client';

import React from 'react';

interface CustomModalFooterProps {
  itemTotalPrice: number;
  isEditMode: boolean;
  onConfirm: () => void;
}

export function CustomModalFooter({
  itemTotalPrice,
  isEditMode,
  onConfirm,
}: CustomModalFooterProps) {
  return (
    <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
      <div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">合計金額</span>
        <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">${itemTotalPrice} 元</span>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-1 cursor-pointer"
      >
        <span>{isEditMode ? '儲存修改' : '加入購物車'}</span>
        <span>(${itemTotalPrice} 元)</span>
      </button>
    </div>
  );
}
