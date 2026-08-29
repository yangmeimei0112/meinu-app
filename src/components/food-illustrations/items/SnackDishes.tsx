'use client';

import React from 'react';

// 🍙 5. 日式香Ｑ御飯糰 (三角米飯糰 + 脆海苔 + 鮭魚/梅子內餡 + 熱氣)
export function AnimatedOnigiriIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 裊裊上升熱氣波浪線條 1 */}
        <path d="M24 16C23 12 27 10 25 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-400/80 dark:text-sky-300/80 animate-steam-1 origin-bottom" />
        {/* 裊裊上升熱氣波浪線條 2 */}
        <path d="M32 17C31 13 35 11 33 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-sky-500 dark:text-sky-400 animate-steam-2 origin-bottom" />
        {/* 裊裊上升熱氣波浪線條 3 */}
        <path d="M40 16C39 12 43 10 41 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-400/80 dark:text-sky-300/80 animate-steam-3 origin-bottom" />

        {/* 三角形溫暖白米飯糰主體 */}
        <path
          d="M32 20C34 20 48 44 46 49C44 54 20 54 18 49C16 44 30 20 32 20Z"
          fill="currentColor"
          className="text-slate-100 dark:text-slate-700"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 酥脆海苔片 (深墨綠色包裹底邊) */}
        <path
          d="M24 38C24 38 32 37 40 38V53H24V38Z"
          fill="currentColor"
          className="text-emerald-950 dark:text-emerald-900"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* 頂部鮭魚/梅子內餡點綴 */}
        <circle cx="32" cy="27" r="2.5" fill="currentColor" className="text-rose-500 dark:text-rose-400" />
      </svg>
    </div>
  );
}

// 🍟 6. 金黃酥脆炸薯條 (經典外帶紅盒 + 現炸金黃細薯)
export function AnimatedFriesIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 後排高低交錯金黃薯條 */}
        <rect x="22" y="14" width="4" height="24" rx="1.5" transform="rotate(-12 22 14)" fill="currentColor" className="text-amber-400" />
        <rect x="30" y="10" width="4" height="28" rx="1.5" fill="currentColor" className="text-amber-300" />
        <rect x="38" y="14" width="4" height="24" rx="1.5" transform="rotate(12 38 14)" fill="currentColor" className="text-amber-400" />

        {/* 前排散開薯條 */}
        <rect x="18" y="20" width="4" height="18" rx="1.5" transform="rotate(-18 18 20)" fill="currentColor" className="text-amber-400" />
        <rect x="26" y="16" width="4" height="22" rx="1.5" transform="rotate(-5 26 16)" fill="currentColor" className="text-amber-300" />
        <rect x="34" y="16" width="4" height="22" rx="1.5" transform="rotate(6 34 16)" fill="currentColor" className="text-amber-300" />
        <rect x="42" y="20" width="4" height="18" rx="1.5" transform="rotate(18 42 20)" fill="currentColor" className="text-amber-400" />

        {/* 經典外帶薯條紙盒 */}
        <path
          d="M16 28 C24 32 40 32 48 28 L43 54 C42.8 55.5 41.5 56.5 40 56.5 H24 C22.5 56.5 21.2 55.5 21 54 L16 28 Z"
          fill="currentColor"
          className="text-red-500 dark:text-red-600"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* 薯條盒中央金黃弧線飾條 */}
        <path d="M26 42 Q32 47 38 42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-amber-300" />
      </svg>
    </div>
  );
}

// 🍰 7. 草莓鮮奶油千層蛋糕 (戚風蛋糕 + 果醬夾心 + 鮮奶霜 + 鮮紅草莓)
export function AnimatedCakeIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 蛋糕底層戚風蛋糕 */}
        <path
          d="M14 36 L48 24 L52 46 C52 48 48 50 32 50 C18 50 14 48 14 46 Z"
          fill="currentColor"
          className="text-amber-300 dark:text-amber-400"
          fillOpacity="0.85"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* 中間層草莓果醬夾心 */}
        <path d="M14 42 L49 30 L50 33 L14 45 Z" fill="currentColor" className="text-rose-500 dark:text-rose-400" />

        {/* 頂部白雪鮮奶油霜層 */}
        <path
          d="M14 36 L48 24 L34 18 L14 36 Z"
          fill="currentColor"
          className="text-slate-50 dark:text-slate-200"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* 鮮紅頂級草莓 */}
        <path
          d="M30 14 C30 10 34 8 36 12 C38 8 42 10 42 14 C42 18 36 22 36 22 C36 22 30 18 30 14 Z"
          fill="currentColor"
          className="text-red-500 dark:text-red-400"
          stroke="currentColor"
          strokeWidth="1.2"
        />

        {/* 草莓綠蒂葉片 */}
        <path d="M34 10 L36 7 L38 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-500" />
      </svg>
    </div>
  );
}

// 🍩 8. 粉紅草莓糖霜甜甜圈 (金黃圈體 + 草莓淋醬 + 繽紛彩色糖粒)
export function AnimatedDonutIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 金黃香烤甜甜圈本體麵團 */}
        <circle
          cx="32"
          cy="34"
          r="20"
          fill="currentColor"
          className="text-amber-400 dark:text-amber-500"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        {/* 粉紅草莓淋醬糖霜 (波浪滴落裙邊) */}
        <path
          d="M15 30 C17 20 47 20 49 30 C47 36 44 33 42 37 C40 33 37 36 34 33 C31 37 28 34 25 37 C23 33 19 36 17 33 C15 31 14 30 15 30 Z"
          fill="currentColor"
          className="text-rose-400 dark:text-rose-400"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* 甜甜圈中心圓孔 (中空) */}
        <circle
          cx="32"
          cy="34"
          r="7"
          fill="currentColor"
          className="text-white dark:text-[#131B2B]"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* 繽紛彩色糖粒 (Sprinkles) */}
        <rect x="23" y="22" width="4" height="1.8" rx="0.9" transform="rotate(30 23 22)" fill="currentColor" className="text-sky-300" />
        <rect x="36" y="20" width="4" height="1.8" rx="0.9" transform="rotate(-20 36 20)" fill="currentColor" className="text-amber-200" />
        <rect x="42" y="27" width="4" height="1.8" rx="0.9" transform="rotate(45 42 27)" fill="currentColor" className="text-emerald-300" />
        <rect x="21" y="32" width="4" height="1.8" rx="0.9" transform="rotate(-35 21 32)" fill="currentColor" className="text-white" />
        <rect x="29" y="24" width="4" height="1.8" rx="0.9" transform="rotate(15 29 24)" fill="currentColor" className="text-yellow-200" />
      </svg>
    </div>
  );
}
