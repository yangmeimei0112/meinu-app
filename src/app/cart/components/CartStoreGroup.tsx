'use client';

import React from 'react';
import Link from 'next/link';
import type { CartItem, StoreCartGroup } from '@/types/cart';
import type { GroupOrder } from '@/types/database';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';
import { Pencil, Trash2, ChevronLeft, ArrowRight } from 'lucide-react';

interface CartStoreGroupProps {
  currentGroup: StoreCartGroup;
  activeStoreId: string;
  activeGroupOrder: GroupOrder | null;
  currentStoreTotal: number;
  onClearStoreCart: (storeId: string) => void;
  onStartEditItem: (item: CartItem) => void;
  onRemoveItem: (storeId: string, cartItemId: string) => void;
  onUpdateQuantity: (storeId: string, cartItemId: string, delta: number) => void;
}

export function CartStoreGroup({
  currentGroup,
  activeStoreId,
  activeGroupOrder,
  currentStoreTotal,
  onClearStoreCart,
  onStartEditItem,
  onRemoveItem,
  onUpdateQuantity,
}: CartStoreGroupProps) {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span>{currentGroup.storeName}</span>
        </h3>
        <button
          type="button"
          onClick={() => onClearStoreCart(activeStoreId)}
          className="text-xs text-slate-400 hover:text-red-500 font-semibold transition cursor-pointer"
        >
          清空此店
        </button>
      </div>

      {/* 個人預算補貼提醒 */}
      {activeGroupOrder?.enable_budget_limit && activeGroupOrder?.budget_limit_amount && (
        <BudgetLimitNotice
          budgetLimit={activeGroupOrder.budget_limit_amount}
          totalAmount={currentStoreTotal}
        />
      )}

      {/* 品項清單 */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {currentGroup.items.map((item) => (
          <div key={item.cartItemId} className="py-3.5 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.name}</h4>
                {item.selectedOptions.length > 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {item.selectedOptions.map((opt) => `${opt.groupTitle}: ${opt.itemName}`).join(' / ')}
                  </p>
                )}
                {item.customNotes && (
                  <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">備註：{item.customNotes}</p>
                )}
              </div>
              <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 shrink-0">
                ${item.totalPrice} 元
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              {/* ✏️ 快速修改規格按鈕 */}
              <button
                type="button"
                onClick={() => onStartEditItem(item)}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700 px-2.5 py-1 rounded-xl transition flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <Pencil className="w-3 h-3 stroke-[2.2]" />
                <span>修改規格</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRemoveItem(activeStoreId, item.cartItemId)}
                  className="text-xs text-slate-300 hover:text-red-500 p-1.5 transition cursor-pointer"
                  title="刪除品項"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(activeStoreId, item.cartItemId, -1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-100">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(activeStoreId, item.cartItemId, 1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部結算與跳轉按鈕 */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between font-extrabold text-base text-slate-800 dark:text-slate-100">
          <span>店家小計金額</span>
          <span className="text-sky-600 dark:text-sky-400 text-lg">${currentStoreTotal} 元</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* ‹ 繼續點餐按鈕 */}
          <Link
            href={`/stores/${activeStoreId}`}
            className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold text-xs py-3 rounded-2xl border border-sky-100 dark:border-slate-700 text-center transition active:scale-95 flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>繼續點餐</span>
          </Link>

          {/* 前往結帳按鈕 */}
          <Link
            href={`/checkout?storeId=${activeStoreId}`}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-xs py-3 rounded-2xl text-center shadow-md transition active:scale-95 flex items-center justify-center gap-1"
          >
            <span>前往結帳</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
