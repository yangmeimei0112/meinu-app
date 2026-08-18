'use client';

import React from 'react';
import Link from 'next/link';
import { useMultiCart } from '@/lib/useMultiCart';

export default function FloatingCartButton() {
  const { cart, isLoaded, totalCartItemCount } = useMultiCart();

  // 若尚未完成客戶端載入，或購物車內完全沒有任何餐點品項，則預設隱藏
  if (!isLoaded || totalCartItemCount <= 0) {
    return null;
  }

  // 計算所有店家的購物車總金額
  const totalAmount = Object.values(cart).reduce(
    (sum, group) =>
      sum +
      group.items.reduce(
        (storeSum, item) => storeSum + (item.totalPrice || item.unitPrice * item.quantity),
        0
      ),
    0
  );

  return (
    <div className="fixed bottom-6 right-5 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200">
      <Link
        href="/cart"
        className="group flex items-center gap-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white pl-3.5 pr-4 py-3 rounded-full shadow-xl hover:shadow-2xl hover:shadow-sky-500/30 border border-white/20 transition-all duration-200 active:scale-95 cursor-pointer select-none"
        aria-label={`查看購物車，共有 ${totalCartItemCount} 件餐點，總計 ${totalAmount} 元`}
      >
        {/* 購物車向量圖示與紅點數字標籤 */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>

          {/* 總品項件數角標 */}
          <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
            {totalCartItemCount > 99 ? '99+' : totalCartItemCount}
          </span>
        </div>

        {/* 購物車文字 */}
        <span className="text-xs font-black tracking-wide">
          購物車
        </span>

        {/* 總金額膠囊標籤 */}
        <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full text-sky-50 tabular-nums">
          ${totalAmount}
        </span>
      </Link>
    </div>
  );
}
