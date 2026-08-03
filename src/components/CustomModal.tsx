'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem } from '@/types/database';
import { CartItem, SelectedOption } from '@/types/cart';

interface OptionGroupData {
  id: string;
  title: string;
  min_select: number;
  max_select: number;
  option_items: {
    id: string;
    name: string;
    extra_price: number;
  }[];
}

interface CustomModalProps {
  item: MenuItem | null;
  storeId: string;
  storeName: string;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export default function CustomModal({
  item,
  storeId,
  storeName,
  onClose,
  onAddToCart,
}: CustomModalProps) {
  const [optionGroups, setOptionGroups] = useState<OptionGroupData[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { name: string; price: number }>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);

  useEffect(() => {
    if (!item) return;

    // 將 item.id 提取成變數，避免 TypeScript 判定可能為 null
    const targetItemId = item.id;

    async function fetchOptions() {
      setLoadingOptions(true);
      const { data } = await supabase
        .from('option_groups')
        .select(`
          id,
          title,
          min_select,
          max_select,
          option_items (
            id,
            name,
            extra_price
          )
        `)
        .eq('menu_item_id', targetItemId)
        .order('sort_order', { ascending: true });

      if (data) {
        setOptionGroups(data as OptionGroupData[]);
        const defaultSelections: Record<string, { name: string; price: number }> = {};
        data.forEach((group) => {
          if (group.option_items && group.option_items.length > 0) {
            defaultSelections[group.title] = {
              name: group.option_items[0].name,
              price: group.option_items[0].extra_price,
            };
          }
        });
        setSelectedOptions(defaultSelections);
      }
      setLoadingOptions(false);
    }

    fetchOptions();
  }, [item]);

  if (!item) return null;

  const optionsExtraTotal = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + opt.price,
    0
  );
  const singleUnitPrice = item.price + optionsExtraTotal;
  const itemTotalPrice = singleUnitPrice * quantity;

  const handleOptionSelect = (groupTitle: string, optionName: string, extraPrice: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupTitle]: { name: optionName, price: extraPrice },
    }));
  };

  const handleConfirmAddToCart = () => {
    const formattedOptions: SelectedOption[] = Object.entries(selectedOptions).map(
      ([groupTitle, opt]) => ({
        groupTitle,
        itemName: opt.name,
        extraPrice: opt.price,
      })
    );

    const newCartItem: CartItem = {
      cartItemId: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      storeId,
      storeName,
      name: item.name,
      unitPrice: item.price,
      quantity,
      selectedOptions: formattedOptions,
      customNotes,
      totalPrice: itemTotalPrice,
    };

    onAddToCart(newCartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
            <p className="text-xs text-orange-500 font-extrabold">${item.price} 元起</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5 flex-1 text-slate-700">
          {loadingOptions ? (
            <div className="text-center py-8 text-slate-400 text-xs animate-pulse">
              載入客製選項中...
            </div>
          ) : (
            optionGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <label className="text-xs font-bold text-slate-600">
                  {group.title} <span className="text-orange-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {group.option_items.map((opt) => {
                    const isSelected =
                      selectedOptions[group.title]?.name === opt.name;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleOptionSelect(group.title, opt.name, opt.extra_price)
                        }
                        className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.name}</span>
                        {opt.extra_price > 0 && (
                          <span className="text-[10px] text-orange-500 font-bold">
                            +${opt.extra_price}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">特製備註</label>
            <div className="flex gap-1.5 flex-wrap">
              {['🥬 不加蔥', '🥫 醬另外放', '🥢 要餐具', '🧊 加厚冰'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setCustomNotes((prev) => (prev ? `${prev}, ${tag}` : tag))
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition"
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="有特殊需求嗎？填寫備註..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-600">購買數量</span>
            <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-2xl text-sm shadow-md hover:brightness-105 active:scale-[0.99] transition flex items-center justify-between px-5"
          >
            <span>加入購物車</span>
            <span>${itemTotalPrice} 元</span>
          </button>
        </div>
      </div>
    </div>
  );
}