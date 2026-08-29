'use client';

import React from 'react';
import { RandomFoodIllustration } from './food-illustrations/FoodIllustrations';

// ----------------------------------------------------
// 🌟 首頁歡迎橫幅卡片組件 (Bento 風格 + 隨機向量美食微動態)
// ----------------------------------------------------
export default function HomeWelcomeBanner() {
  return (
    <div className="relative overflow-hidden bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 group">
      {/* 頂部細緻漸層掃描光條 */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-400/0 via-sky-400/60 to-blue-600/0 dark:via-sky-400/80" />

      {/* 背景柔和多點環境氛圍光暈 */}
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br from-sky-400/15 via-blue-500/10 to-transparent rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-110" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-gradient-to-tr from-indigo-500/10 via-sky-400/10 to-transparent rounded-full blur-xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4">
        {/* 左側排版文案 */}
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* 頂部標籤與脈衝雷達點 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-sky-200/70 dark:border-sky-800/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
              </span>
              <span>歡迎來到</span>
            </span>
          </div>

          {/* 主標題 (SEO H1 核心關鍵字) */}
          <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            「咩nu」揪團點餐大廳
          </h1>

          {/* 說明文字 */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            自由挑選喜歡的店家菜單，隨手揪團輕鬆點餐！
          </p>
        </div>

        {/* 右側 8 大隨機微動態插圖 */}
        <RandomFoodIllustration />
      </div>
    </div>
  );
}
