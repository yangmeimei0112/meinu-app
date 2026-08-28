'use client';

import React, { useState, useCallback } from 'react';
import { MenuItem } from '@/types/database';
import { Flame, Ban, Plus, Check } from 'lucide-react';

interface StoreProductCardProps {
  item: MenuItem;
  popularQty: number;
  onSelect: (item: MenuItem) => void;
}

function StoreProductCardInner({ item, popularQty, onSelect }: StoreProductCardProps) {
  const isSoldOut = item.is_sold_out;
  // P2-C：短暫 ✓ 視覺反饋狀態
  const [justAdded, setJustAdded] = useState(false);

  const handleSelect = useCallback(() => {
    if (isSoldOut) return;
    onSelect(item);
    // 短暫顯示 ✓ 圖示，給予即時視覺確認
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);
  }, [isSoldOut, onSelect, item]);

  return (
    <div
      onClick={handleSelect}
      className={`bg-white dark:bg-[#131B2B] rounded-3xl p-4 border shadow-xs transition flex items-center justify-between gap-3 content-auto ${
        isSoldOut
          ? 'border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
          : 'border-slate-100 dark:border-slate-800/80 hover:border-sky-200 dark:hover:border-sky-500/40 cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.name}</h4>
          {isSoldOut && (
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Ban className="w-3 h-3 text-slate-400" />
              <span>已售完</span>
            </span>
          )}
          {popularQty > 0 && (
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500 shrink-0" />
              <span>本團已點 {popularQty} 份</span>
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-2">{item.description}</p>
        )}
        <p className="text-sm font-extrabold text-sky-600 dark:text-sky-400">${item.price} 元</p>
      </div>

      <button
        type="button"
        disabled={isSoldOut}
        aria-label={isSoldOut ? '已售完' : `加入 ${item.name}`}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 border ${
          isSoldOut
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            : justAdded
            ? 'bg-emerald-500 text-white border-emerald-500 scale-95'
            : 'bg-sky-50 dark:bg-slate-800 hover:bg-sky-500 dark:hover:bg-sky-600 text-sky-600 dark:text-sky-300 hover:text-white border-sky-200 dark:border-slate-700 cursor-pointer'
        }`}
      >
        {isSoldOut ? (
          <span className="flex items-center gap-1">
            <Ban className="w-3 h-3" />
            <span>已售完</span>
          </span>
        ) : justAdded ? (
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>已加入</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Plus className="w-3 h-3" />
            <span>選購</span>
          </span>
        )}
      </button>
    </div>
  );
}

// P1-A：React.memo 避免父層搜尋輸入時不相關卡片重新渲染
const StoreProductCard = React.memo(StoreProductCardInner);
StoreProductCard.displayName = 'StoreProductCard';

export default StoreProductCard;
