'use client';

import React, { useState, useEffect } from 'react';

// ----------------------------------------------------
// 🍔 1. 美味層次漢堡 (金黃芝麻麵包 + 生菜 + 番茄 + 融化起司 + 紅潤厚牛肉排)
// ----------------------------------------------------
function AnimatedBurgerIllustration() {
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

// ----------------------------------------------------
// 🍜 2. 熱騰騰拉麵微動態 (瓷碗 + 麵條溏心蛋 + 裊裊熱氣)
// ----------------------------------------------------
function AnimatedRamenIllustration() {
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

// ----------------------------------------------------
// 🍕 3. 金黃起司披薩切片 (脆皮餅皮 + 熔岩切達起司 + 經典臘腸片)
// ----------------------------------------------------
function AnimatedPizzaIllustration() {
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

// ----------------------------------------------------
// 🧋 4. 黑糖波霸珍珠奶茶 (透明杯 + 粗吸管 + 冰塊 + 沉底黑糖珍珠)
// ----------------------------------------------------
function AnimatedBobaTeaIllustration() {
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

// ----------------------------------------------------
// 🍙 5. 日式香Ｑ御飯糰 (三角米飯糰 + 脆海苔 + 鮭魚/梅子內餡 + 熱氣)
// ----------------------------------------------------
function AnimatedOnigiriIllustration() {
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

// ----------------------------------------------------
// 🍟 6. 金黃酥脆炸薯條 (經典外帶紅盒 + 現炸金黃細薯)
// ----------------------------------------------------
function AnimatedFriesIllustration() {
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

// ----------------------------------------------------
// 🍰 7. 草莓鮮奶油千層蛋糕 (戚風蛋糕 + 果醬夾心 + 鮮奶霜 + 鮮紅草莓)
// ----------------------------------------------------
function AnimatedCakeIllustration() {
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

// ----------------------------------------------------
// 🍩 8. 粉紅草莓糖霜甜甜圈 (金黃圈體 + 草莓淋醬 + 繽紛彩色糖粒)
// ----------------------------------------------------
function AnimatedDonutIllustration() {
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

// ----------------------------------------------------
// 🎲 8 大隨機美食微動態輪播器 (點擊亦可循環切換)
// ----------------------------------------------------
function RandomFoodIllustration() {
  const [illustrationIndex, setIllustrationIndex] = useState<number>(0);

  // 進入首頁時隨機選取 1 組美食動畫 (0 ~ 7 共 8 款經典美食)
  useEffect(() => {
    setIllustrationIndex(Math.floor(Math.random() * 8));
  }, []);

  const handleNext = () => {
    setIllustrationIndex((prev) => (prev + 1) % 8);
  };

  return (
    <div
      onClick={handleNext}
      title="點擊切換下一個美食小動畫 (共 8 款)"
      className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center select-none shrink-0 group cursor-pointer active:scale-95 transition-transform"
    >
      {/* 柔和背景擴散脈衝光暈 */}
      <div className="absolute inset-0 bg-sky-400/20 dark:bg-sky-500/20 rounded-full blur-xl animate-pulse-glow" />

      {/* 隨機渲染的精緻純向量微動態 */}
      <div className="transition-transform duration-300 group-hover:scale-110">
        {illustrationIndex === 0 && <AnimatedBurgerIllustration />}
        {illustrationIndex === 1 && <AnimatedRamenIllustration />}
        {illustrationIndex === 2 && <AnimatedPizzaIllustration />}
        {illustrationIndex === 3 && <AnimatedBobaTeaIllustration />}
        {illustrationIndex === 4 && <AnimatedOnigiriIllustration />}
        {illustrationIndex === 5 && <AnimatedFriesIllustration />}
        {illustrationIndex === 6 && <AnimatedCakeIllustration />}
        {illustrationIndex === 7 && <AnimatedDonutIllustration />}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 🌟 首頁歡迎橫幅卡片組件
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
        {/* 左側排版文案 (採用前版經典用詞，並移除 MEINU HUB) */}
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

          {/* 主標題 */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            「咩nu」開放點餐大廳
          </h2>

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
