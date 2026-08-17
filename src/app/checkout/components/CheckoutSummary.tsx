'use client';

import React from 'react';
import { CartItem } from '@/types/cart';

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  grandTotal: number;
}

export default function CheckoutSummary({ cartItems, grandTotal }: CheckoutSummaryProps) {
  if (cartItems.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        1. 點餐明細 ({cartItems[0]?.storeName})
      </h3>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {cartItems.map((item) => (
          <div key={item.cartItemId} className="py-2.5 space-y-1">
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-100">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span className="text-sky-600 dark:text-sky-400">${item.totalPrice} 元</span>
            </div>
            {item.selectedOptions.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-400">
                {item.selectedOptions.map((opt) => `${opt.groupTitle}: ${opt.itemName}`).join(' / ')}
              </p>
            )}
            {item.customNotes && (
              <p className="text-xs text-sky-600 dark:text-sky-400">備註：{item.customNotes}</p>
            )}
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-extrabold text-base text-slate-800 dark:text-slate-100">
        <span>合計總金額</span>
        <span className="text-sky-600 dark:text-sky-400">${grandTotal} 元</span>
      </div>
    </div>
  );
}
