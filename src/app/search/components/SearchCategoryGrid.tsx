'use client';

import React from 'react';
import type { Category } from '@/types/database';
import { stripEmojis } from '@/lib/icon-utils';
import {
  Sparkles,
  Coffee,
  Soup,
  CookingPot,
  Sandwich,
  Drumstick,
  Cake,
  Pizza,
  UtensilsCrossed,
} from 'lucide-react';

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('飲') || lower.includes('茶') || lower.includes('咖啡') || lower.includes('水') || lower.includes('手搖')) {
    return <Coffee className="w-6 h-6 text-amber-500" />;
  }
  if (lower.includes('麵') || lower.includes('粉') || lower.includes('湯') || lower.includes('拉麵') || lower.includes('烏龍')) {
    return <Soup className="w-6 h-6 text-sky-500" />;
  }
  if (lower.includes('飯') || lower.includes('便當') || lower.includes('台式') || lower.includes('熱炒') || lower.includes('餐盒')) {
    return <CookingPot className="w-6 h-6 text-emerald-500" />;
  }
  if (lower.includes('早') || lower.includes('吐司') || lower.includes('三明治') || lower.includes('漢堡') || lower.includes('輕食')) {
    return <Sandwich className="w-6 h-6 text-amber-500" />;
  }
  if (lower.includes('炸') || lower.includes('雞') || lower.includes('烤') || lower.includes('排')) {
    return <Drumstick className="w-6 h-6 text-orange-500" />;
  }
  if (lower.includes('甜') || lower.includes('點心') || lower.includes('蛋糕') || lower.includes('冰') || lower.includes('豆花') || lower.includes('烘焙')) {
    return <Cake className="w-6 h-6 text-rose-500" />;
  }
  if (lower.includes('披薩') || lower.includes('義') || lower.includes('美') || lower.includes('洋食') || lower.includes('義大利')) {
    return <Pizza className="w-6 h-6 text-red-500" />;
  }
  return <UtensilsCrossed className="w-6 h-6 text-sky-500" />;
}

interface SearchCategoryGridProps {
  categories: Category[];
  loading: boolean;
  onSelectCategory: (name: string) => void;
}

export function SearchCategoryGrid({
  categories,
  loading,
  onSelectCategory,
}: SearchCategoryGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>店家分類</span>
        </h3>
        {categories.length > 0 && (
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            共 {categories.length} 種分類
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-[#131B2B] border border-slate-100 dark:border-slate-800 animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
              <div className="w-10 h-3 rounded bg-slate-100 dark:bg-slate-800/80" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-4 gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(stripEmojis(cat.name))}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-[#131B2B] border border-slate-100 dark:border-slate-800/80 shadow-2xs hover:border-sky-300 dark:hover:border-sky-500/50 hover:shadow-xs transition active:scale-95 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                {getCategoryIcon(cat.name)}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-500 transition-colors truncate max-w-full px-1">
                {stripEmojis(cat.name)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
          目前後台尚未建立店家分類
        </p>
      )}
    </div>
  );
}
