'use client';

import React, { useState, useEffect } from 'react';
import {
  AnimatedBurgerIllustration,
  AnimatedRamenIllustration,
  AnimatedPizzaIllustration,
  AnimatedBobaTeaIllustration,
} from './items/MainDishes';
import {
  AnimatedOnigiriIllustration,
  AnimatedFriesIllustration,
  AnimatedCakeIllustration,
  AnimatedDonutIllustration,
} from './items/SnackDishes';

// 重新匯出所有獨立插圖，確保舊有 import 100% 相容
export {
  AnimatedBurgerIllustration,
  AnimatedRamenIllustration,
  AnimatedPizzaIllustration,
  AnimatedBobaTeaIllustration,
  AnimatedOnigiriIllustration,
  AnimatedFriesIllustration,
  AnimatedCakeIllustration,
  AnimatedDonutIllustration,
};

// ----------------------------------------------------
// 🎲 8 大隨機美食微動態輪播器 (點擊亦可循環切換)
// ----------------------------------------------------
export function RandomFoodIllustration() {
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
