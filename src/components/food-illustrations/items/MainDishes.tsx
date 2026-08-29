'use client';

import React from 'react';

// 🍔 1. 美味層次漢堡 (金黃芝麻麵包 + 生菜 + 番茄 + 融化起司 + 紅潤厚牛肉排)
export function AnimatedBurgerIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 頂層漢堡麵包 (金黃弧形頂蓋) */}
        <path
          d="M14 28C14 17 22 14 32 14C42 14 50 17 50 28H14Z"
          fill="currentColor"
          className="text-amber-500 dark:text-amber-400"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 白芝麻粒 */}
        <ellipse cx="24" cy="20" rx="1.2" ry="2" transform="rotate(-20 24 20)" fill="currentColor" className="text-amber-300" />
        <ellipse cx="32" cy="18" rx="1.2" ry="2" fill="currentColor" className="text-amber-300" />
        <ellipse cx="40" cy="20" rx="1.2" ry="2" transform="rotate(20 40 20)" fill="currentColor" className="text-amber-300" />

        {/* 翠綠波浪生菜層 */}
        <path
          d="M12 30C15 33 18 30 21 33C24 30 27 33 30 30C33 33 36 30 39 33C42 30 45 33 48 30C50 32 52 30 52 30"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="text-emerald-500 dark:text-emerald-400"
        />

        {/* 鮮紅熟成番茄切片 */}
        <rect x="16" y="32" width="32" height="4.5" rx="2" fill="currentColor" className="text-red-500 dark:text-red-400" fillOpacity="0.9" />

        {/* 濃郁起司熔岩切片 */}
        <path d="M15 35L49 35L45 40L38 35L32 41L25 35L18 40L15 35Z" fill="currentColor" className="text-amber-400 dark:text-amber-300" fillOpacity="0.9" />

        {/* 炙烤厚實多汁牛肉排 (紅潤肉褐色) */}
        <rect
          x="14"
          y="38"
          width="36"
          height="7.5"
          rx="3.5"
          fill="currentColor"
          className="text-rose-700 dark:text-rose-600"
          fillOpacity="0.85"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* 底層漢堡麵包 */}
        <path
          d="M16 47H48C48 53 42 55 32 55C22 55 16 53 16 47Z"
          fill="currentColor"
          className="text-amber-500 dark:text-amber-400"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// 🍜 2. 熱騰騰拉麵微動態 (瓷碗 + 麵條溏心蛋 + 裊裊熱氣)
export function AnimatedRamenIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 裊裊上升熱氣波浪線條 1 */}
        <path d="M25 18C24 14 28 12 26 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-400/80 dark:text-sky-300/80 animate-steam-1 origin-bottom" />
        {/* 裊裊上升熱氣波浪線條 2 (交錯延遲) */}
        <path d="M33 19C32 15 36 13 34 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-sky-500 dark:text-sky-400 animate-steam-2 origin-bottom" />
        {/* 裊裊上升熱氣波浪線條 3 */}
        <path d="M41 18C40 14 44 12 42 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-400/80 dark:text-sky-300/80 animate-steam-3 origin-bottom" />

        {/* 架在碗上的木筷子 */}
        <line x1="12" y1="22" x2="52" y2="26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-amber-600/90 dark:text-amber-400/90" />

        {/* 濃郁湯頭與麵條波浪線 */}
        <path d="M18 30Q24 26 30 30Q36 26 42 30Q45 28 48 30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-amber-400" />

        {/* 溏心蛋切面 (蛋白 + 蛋黃) */}
        <ellipse cx="26" cy="30" rx="4.5" ry="3.5" fill="white" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-600" />
        <circle cx="26" cy="30" r="2.2" fill="currentColor" className="text-amber-500" />

        {/* 海苔片裝飾 */}
        <rect x="36" y="24" width="7" height="9" rx="1.5" transform="rotate(12 36 24)" fill="currentColor" className="text-emerald-800 dark:text-emerald-950" />

        {/* 精緻瓷碗身 */}
        <path
          d="M14 30C15 48 49 48 50 30H14Z"
          fill="currentColor"
          className="text-sky-500 dark:text-sky-400"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 瓷碗底座 */}
        <path d="M26 48H38V52H26V48Z" fill="currentColor" className="text-sky-600 dark:text-sky-500" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />

        {/* 碗身幾何飾紋線 */}
        <path d="M20 37H44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" className="text-sky-400/70" />
      </svg>
    </div>
  );
}

// 🍕 3. 金黃起司披薩切片 (脆皮餅皮 + 熔岩切達起司 + 經典臘腸片)
export function AnimatedPizzaIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 披薩餅皮厚邊 (金黃烤色) */}
        <path
          d="M14 16C24 12 40 12 50 16L32 54L14 16Z"
          fill="currentColor"
          className="text-amber-500 dark:text-amber-400"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 頂部香烤脆皮外圈 */}
        <path
          d="M13 16C23 11 41 11 51 16"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-amber-600 dark:text-amber-500"
        />

        {/* 濃郁金黃起司與番茄醬底 */}
        <path
          d="M17 19C25 15 39 15 47 19L32 50L17 19Z"
          fill="currentColor"
          className="text-amber-400 dark:text-amber-300"
          fillOpacity="0.9"
        />

        {/* 經典辣味香腸臘腸片 (Pepperoni) */}
        <circle cx="28" cy="25" r="3.5" fill="currentColor" className="text-rose-600 dark:text-rose-500" />
        <circle cx="38" cy="30" r="3" fill="currentColor" className="text-rose-600 dark:text-rose-500" />
        <circle cx="31" cy="40" r="2.5" fill="currentColor" className="text-rose-600 dark:text-rose-500" />

        {/* 羅勒/青椒碎粒點綴 */}
        <rect x="33" y="21" width="2" height="2" rx="0.5" fill="currentColor" className="text-emerald-500" />
        <rect x="23" y="32" width="2" height="2" rx="0.5" fill="currentColor" className="text-emerald-500" />
        <rect x="36" y="38" width="2" height="2" rx="0.5" fill="currentColor" className="text-emerald-500" />
      </svg>
    </div>
  );
}

// 🧋 4. 黑糖波霸珍珠奶茶 (透明杯 + 粗吸管 + 冰塊 + 沉底黑糖珍珠)
export function AnimatedBobaTeaIllustration() {
  return (
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 animate-float-slow">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* 斜插粗吸管 */}
        <line
          x1="36"
          y1="8"
          x2="24"
          y2="50"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="text-amber-500 dark:text-amber-400"
        />

        {/* 圓頂封口膜/杯蓋 */}
        <path
          d="M17 20C21 16 43 16 47 20H17Z"
          fill="currentColor"
          className="text-sky-500 dark:text-sky-400"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="2"
        />

        {/* 透明手搖外帶杯身 */}
        <path
          d="M18 20L22 54C22.2 56 24 57.5 26 57.5H38C40 57.5 41.8 56 42 54L46 20H18Z"
          fill="currentColor"
          className="text-sky-500 dark:text-sky-400"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 鮮奶茶濃郁茶湯層 */}
        <path
          d="M20 28L22.5 53H41.5L44 28C38 31 26 25 20 28Z"
          fill="currentColor"
          className="text-amber-400 dark:text-amber-300"
          fillOpacity="0.65"
        />

        {/* 底部黑糖波霸珍珠 (Q彈圓滾滾) */}
        <circle cx="26" cy="49" r="2.5" fill="currentColor" className="text-amber-950 dark:text-slate-900" />
        <circle cx="32" cy="51" r="2.5" fill="currentColor" className="text-amber-950 dark:text-slate-900" />
        <circle cx="38" cy="49" r="2.5" fill="currentColor" className="text-amber-950 dark:text-slate-900" />
        <circle cx="29" cy="44" r="2.5" fill="currentColor" className="text-amber-950 dark:text-slate-900" />
        <circle cx="35" cy="44" r="2.5" fill="currentColor" className="text-amber-950 dark:text-slate-900" />

        {/* 冰塊幾何方塊 */}
        <rect x="25" y="32" width="5" height="5" rx="1" transform="rotate(15 25 32)" fill="white" fillOpacity="0.6" stroke="currentColor" strokeWidth="1" className="text-white/80" />
        <rect x="33" y="30" width="5" height="5" rx="1" transform="rotate(-10 33 30)" fill="white" fillOpacity="0.6" stroke="currentColor" strokeWidth="1" className="text-white/80" />
      </svg>
    </div>
  );
}
