'use client';

import React from 'react';
import { X } from 'lucide-react';

interface CustomModalHeaderProps {
  name: string;
  price: number;
  isEditMode: boolean;
  onClose: () => void;
}

export function CustomModalHeader({
  name,
  price,
  isEditMode,
  onClose,
}: CustomModalHeaderProps) {
  return (
    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
      <div>
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>{name}</span>
          {isEditMode && (
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
              修改規格
            </span>
          )}
        </h3>
        <p className="text-xs text-sky-600 dark:text-sky-400 font-extrabold mt-0.5">
          ${price} 元
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center active:scale-95 cursor-pointer"
        aria-label="關閉"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
