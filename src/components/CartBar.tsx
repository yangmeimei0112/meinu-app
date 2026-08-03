'use client';

import Link from 'next/link';
import { CartItem } from '@/types/cart';

interface CartBarProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

export default function CartBar({ cartItems, onClearCart }: CartBarProps) {
  if (cartItems.length === 0) return null;

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-md mx-auto">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl flex items-center justify-between border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-3">
          <div className="relative bg-sky-500 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs">
            🛒
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
            className="text-xs text-slate-400 hover:text-red-400 p-2 transition"
          >
            清空
          </button>
          <Link
            href="/cart"
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 inline-block"
          >
            查看購物車 ➔
          </Link>
        </div>
      </div>
    </div>
  );
}