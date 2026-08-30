'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ⚠️ 極簡三角形驚嘆號 ＋ 外圍 RELOADING 轉圈圈動畫核心
 * 精準呈現中心警示標誌與流暢旋轉光環，乾淨純粹不花哨
 */
export function TriangleWarningCore() {
  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 mx-auto flex items-center justify-center select-none my-2">
      {/* 1. 外圍 RELOADING 旋轉轉圈圈光環 (Smooth Circular Reloading Spinner) */}
      <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 dark:border-amber-400/20 border-t-amber-500 dark:border-t-amber-400 border-r-amber-500/60 dark:border-r-amber-400/60 animate-spin" />

      {/* 2. 內層靜態微弱底環 (Subtle Guide Ring) */}
      <div className="absolute inset-2 rounded-full border border-amber-500/10 dark:border-amber-400/10 pointer-events-none" />

      {/* 3. 中心三角形驚嘆號標誌 (Center Triangle Exclamation Icon) */}
      <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/30 flex items-center justify-center shadow-inner">
        <AlertTriangle className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500 dark:text-amber-400 stroke-[2.2] drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]" />
      </div>
    </div>
  );
}

