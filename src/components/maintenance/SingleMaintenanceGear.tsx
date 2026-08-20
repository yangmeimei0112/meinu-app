'use client';

import React from 'react';

// ----------------------------------------------------
// ⚙️ 單一精緻旋轉維修齒輪 SVG 動畫組件 (無任何 Emoji)
// ----------------------------------------------------
export function SingleMaintenanceGear() {
  return (
    <div className="relative w-36 h-36 mx-auto flex items-center justify-center select-none">
      {/* 背景柔和脈衝光暈 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-blue-500/20 to-sky-400/10 rounded-full blur-2xl animate-pulse-glow" />

      {/* 單一平滑旋轉維修齒輪 */}
      <div className="relative w-28 h-28 text-sky-500 dark:text-sky-400 animate-spin-slow">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* 齒輪主體輪廓 */}
          <path
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
            d="M50 15 
               L53 15 L55 22 L62 25 L68 20 L73 24 L70 31 L76 36 L83 34 L85 41 L80 47 L82 53 L89 57 L87 64 L80 66 L78 73 L83 79 L78 84 L72 80 L66 84 L65 91 L58 91 L55 84 L48 84 L45 91 L38 91 L37 84 L31 80 L25 84 L20 79 L25 73 L23 66 L16 64 L14 57 L21 53 L23 47 L18 41 L20 34 L27 36 L33 31 L30 24 L35 20 L41 25 L48 22 Z"
          />
          {/* 齒輪內同心圓刻度 */}
          <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
