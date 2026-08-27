'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export function CartEmptyState() {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 space-y-3 shadow-xs">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
        <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
        目前所有店家的購物車都是空的喔！
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">快前往大廳挑選喜歡的店家吧！</p>
      <Link
        href="/"
        className="inline-flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-xs transition active:scale-95"
      >
        <span>前往點餐大廳</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
