'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CartItem } from '@/types/cart';
import { ShoppingCart, ArrowRight, Trash2 } from 'lucide-react';

interface CartBarProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

function CartBarInner({ cartItems, onClearCart }: CartBarProps) {
  // 避免重複計算 (Hook 必須在 early return 之前調用)
  const { totalQuantity, grandTotal } = useMemo(() => ({
    totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    grandTotal: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
  }), [cartItems]);

  if (cartItems.length === 0) return null;

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
      <div className="bg-slate-900/95 dark:bg-[#0B101B]/95 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-slate-700/80 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <div className="relative bg-sky-500 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs">
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
              {totalQuantity}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400">已選 {cartItems.length} 項餐點</p>
            <p className="text-base font-extrabold text-white">${grandTotal} 元</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-slate-400 hover:text-red-400 p-2 transition flex items-center gap-1 cursor-pointer"
            aria-label="清空此店購物車"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空</span>
          </button>
          <Link
            href="/cart"
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
          >
            <span>查看購物車</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// P1-D：React.memo 避免父層無關 state 觸發購物車條重渲染
const CartBar = React.memo(CartBarInner);
CartBar.displayName = 'CartBar';

export default CartBar;