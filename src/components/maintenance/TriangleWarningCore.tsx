'use client';

import React from 'react';
import { AlertTriangle, Sparkles, Activity, ShieldAlert } from 'lucide-react';

// ----------------------------------------------------
// ⚠️ 現代科技感三角形驚嘆號量子維護核心 (Triangle Warning Kinetic Core)
// 具備多層呼吸光暈、能量波紋、旋轉軌道衛星微光點與全息懸浮立體質感
// ----------------------------------------------------
export function TriangleWarningCore() {
  return (
    <div className="relative w-48 h-48 sm:w-52 sm:h-52 mx-auto flex items-center justify-center select-none py-2">
      {/* 1. 量子脈衝發散光暈 (Multi-Tier Ambient Glow) */}
      <div className="absolute inset-2 bg-gradient-to-tr from-amber-500/25 via-sky-500/20 to-indigo-500/20 rounded-full blur-2xl animate-pulse-glow" />
      <div className="absolute inset-6 bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-yellow-400/15 rounded-full blur-xl animate-pulse-glow" />

      {/* 2. 動態外擴同心能量波紋 (Concentric Pulse Waves) */}
      <div className="absolute inset-0 rounded-full border border-amber-400/25 dark:border-amber-400/35 animate-pulse-ripple pointer-events-none" />

      {/* 3. 最外層：精密科技軌道環 (順時針 20s 緩慢旋轉) */}
      <div className="absolute inset-1 rounded-full border border-dashed border-amber-400/35 dark:border-amber-400/45 animate-spin-slow pointer-events-none">
        {/* 軌道衛星光點 1 */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24] ring-2 ring-amber-300/40" />
        {/* 軌道衛星光點 2 */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
      </div>

      {/* 4. 中層：精緻圓角科技幾何三角形 (Cyber Kinetic Triangle) */}
      <div className="relative w-36 h-36 flex items-center justify-center animate-bounce-gentle">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
          <defs>
            <linearGradient id="triangleGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="triangleBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* 外層精密刻度三角形 */}
          <polygon
            points="50,14 88,80 12,80"
            fill="url(#triangleGlowGrad)"
            stroke="url(#triangleBorderGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* 內部同心點線裝飾 */}
          <polygon
            points="50,23 81,75 19,75"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            className="text-amber-400/50 dark:text-amber-400/60"
            strokeLinejoin="round"
          />

          {/* 頂點科技微光圓點 */}
          <circle cx="50" cy="14" r="2.5" className="fill-amber-400" />
          <circle cx="88" cy="80" r="2.5" className="fill-sky-400" />
          <circle cx="12" cy="80" r="2.5" className="fill-amber-400" />
        </svg>

        {/* 5. 中心發光驚嘆號圖示 (Glowing Central Exclamation HUD) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 dark:text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] stroke-[2.4]" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 6. 懸浮衛星狀態標籤（營造精密儀表板質感） */}
      <div className="absolute -left-2 top-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-300/80 dark:border-amber-500/40 shadow-xs flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 animate-float-slow">
        <ShieldAlert className="w-3 h-3 text-amber-500" />
        <span>MAINT-LOCK</span>
      </div>

      <div
        className="absolute -right-2 bottom-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-sky-300/80 dark:border-sky-500/40 shadow-xs flex items-center gap-1.5 text-[10px] font-mono font-bold text-sky-700 dark:text-sky-300 animate-float-slow"
        style={{ animationDelay: '1.8s' }}
      >
        <Activity className="w-3 h-3 text-sky-500 animate-pulse" />
        <span>LIVE UPGRADE</span>
      </div>
    </div>
  );
}
