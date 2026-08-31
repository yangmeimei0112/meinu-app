'use client';

import React from 'react';
import { Category } from '@/types/database';
import { stripEmojis } from '@/lib/icon-utils';

interface HomeCategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
}

export function HomeCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: HomeCategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-touch">
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
          selectedCategory === 'all'
            ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-500/30'
            : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
        }`}
      >
        全部店家
      </button>
      {categories.map((cat: Category) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelectCategory(cat.id)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
            selectedCategory === cat.id
              ? 'bg-sky-500 text-white shadow-sky-500/25 ring-2 ring-sky-500/30'
              : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-slate-700'
          }`}
        >
          {stripEmojis(cat.name)}
        </button>
      ))}
    </div>
  );
}
