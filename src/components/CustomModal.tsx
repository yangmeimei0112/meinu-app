'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CustomGroup } from '@/types/database';
import { CartItem, SelectedOption } from '@/types/cart';

interface CustomModalProps {
  item: MenuItem | null;
  storeId: string;
  storeName: string;
  existingCartItem?: CartItem | null;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  onUpdateCartItem?: (updatedItem: CartItem) => void;
}

export default function CustomModal({
  item,
  storeId,
  storeName,
  existingCartItem,
  onClose,
  onAddToCart,
  onUpdateCartItem,
}: CustomModalProps) {
  // ⚡ 優先直接讀取 item 內已預載的 custom_groups（進入商店時已在背景載入完畢，0ms 瞬開）
  const initialGroups = useMemo<CustomGroup[]>(() => {
    if (item?.custom_groups && Array.isArray(item.custom_groups)) {
      return item.custom_groups;
    }
    return [];
  }, [item]);

  const [customGroups, setCustomGroups] = useState<CustomGroup[]>(initialGroups);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState<number>(existingCartItem?.quantity || 1);
  const [customNotes, setCustomNotes] = useState<string>(existingCartItem?.customNotes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  // 初始化或更新選項狀態
  useEffect(() => {
    if (!item) return;

    let groups = (item.custom_groups && Array.isArray(item.custom_groups)) ? item.custom_groups : [];

    // 若商品未帶 custom_groups，才在背景發送向下相容查詢
    if (groups.length === 0) {
      supabase
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
        .eq('menu_item_id', item.id)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            interface OptionGroupRow {
              id: string;
              title: string;
              min_select: number;
              max_select: number;
              option_items: Array<{
                id: string;
                name: string;
                extra_price: number;
              }>;
            }
            const mappedGroups: CustomGroup[] = (data as unknown as OptionGroupRow[]).map((g) => ({
              id: g.id,
              title: g.title,
              type: g.max_select === 1 ? 'single' : g.max_select > 1 ? 'limit' : 'any',
              limit_number: g.max_select,
              options: (g.option_items || []).map((opt) => ({
                id: opt.id,
                name: opt.name,
                price_adjustment: opt.extra_price || 0,
              })),
            }));
            setCustomGroups(mappedGroups);
            initializeSelections(mappedGroups);
          }
        });
    }

    setCustomGroups(groups);
    initializeSelections(groups);

    function initializeSelections(currentGroups: CustomGroup[]) {
      if (existingCartItem && existingCartItem.rawCustomSelections) {
        setSelectedOptions(existingCartItem.rawCustomSelections);
      } else {
        const initialSelections: Record<string, string[]> = {};
        currentGroups.forEach((g) => {
          if (g.type === 'single' && g.options.length > 0) {
            initialSelections[g.id] = [g.options[0].id];
          } else {
            initialSelections[g.id] = [];
          }
        });
        setSelectedOptions(initialSelections);

        const draftKey = `menu_app_draft_${item?.id}`;
        if (currentGroups.length === 0) {
          localStorage.removeItem(draftKey);
          setHasDraft(false);
        } else {
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              if (parsed && parsed.selectedOptions && Object.keys(parsed.selectedOptions).length > 0) {
                setHasDraft(true);
              } else {
                setHasDraft(false);
              }
            } catch (e) {
              console.error('讀取草稿失敗', e);
              setHasDraft(false);
            }
          } else {
            setHasDraft(false);
          }
        }
      }
    }
  }, [item, existingCartItem]);

  // 自動暫存草稿至 LocalStorage（僅在有客製化選項且為新增模式時）
  useEffect(() => {
    if (!item || existingCartItem || customGroups.length === 0) return;
    const draftKey = `menu_app_draft_${item.id}`;
    const draftData = {
      selectedOptions,
      quantity,
      customNotes,
      savedAt: Date.now(),
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [selectedOptions, quantity, customNotes, item, existingCartItem, customGroups.length]);

  const handleRestoreDraft = () => {
    if (!item) return;
    const draftKey = `menu_app_draft_${item.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.selectedOptions) setSelectedOptions(parsed.selectedOptions);
        if (parsed.quantity) setQuantity(parsed.quantity);
        if (parsed.customNotes) setCustomNotes(parsed.customNotes);
        setHasDraft(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDiscardDraft = () => {
    if (!item) return;
    localStorage.removeItem(`menu_app_draft_${item.id}`);
    setHasDraft(false);
  };

  if (!item) return null;

  // 處理選項點擊
  const handleSelectOption = (group: CustomGroup, optionId: string) => {
    setErrorMsg(null);
    const currentList = selectedOptions[group.id] || [];

    if (group.type === 'single') {
      setSelectedOptions((prev) => ({ ...prev, [group.id]: [optionId] }));
    } else if (group.type === 'any') {
      const updated = currentList.includes(optionId)
        ? currentList.filter((id) => id !== optionId)
        : [...currentList, optionId];
      setSelectedOptions((prev) => ({ ...prev, [group.id]: updated }));
    } else if (group.type === 'limit') {
      const limitMax = group.limit_number || 1;
      if (currentList.includes(optionId)) {
        setSelectedOptions((prev) => ({
          ...prev,
          [group.id]: currentList.filter((id) => id !== optionId),
        }));
      } else {
        if (currentList.length >= limitMax) {
          setErrorMsg(`「${group.title}」最多只能選擇 ${limitMax} 個選項！`);
          return;
        }
        setSelectedOptions((prev) => ({
          ...prev,
          [group.id]: [...currentList, optionId],
        }));
      }
    }
  };

  // 計算加價總額與選取項目文字
  let totalExtraPrice = 0;
  const formattedSelectedOptions: SelectedOption[] = [];

  customGroups.forEach((group) => {
    const selectedIds = selectedOptions[group.id] || [];
    group.options.forEach((opt) => {
      if (selectedIds.includes(opt.id)) {
        totalExtraPrice += opt.price_adjustment || 0;
        formattedSelectedOptions.push({
          groupTitle: group.title,
          itemName: opt.name,
          extraPrice: opt.price_adjustment || 0,
        });
      }
    });
  });

  const singleUnitPrice = item.price + totalExtraPrice;
  const itemTotalPrice = singleUnitPrice * quantity;

  // 確認加入購物車或更新購物車
  const handleConfirm = () => {
    // 驗證規則
    for (const group of customGroups) {
      const selected = selectedOptions[group.id] || [];
      if (group.type === 'single' && selected.length === 0) {
        setErrorMsg(`請選擇「${group.title}」（必選 1 個）`);
        return;
      }
      if (group.type === 'limit' && group.limit_number && selected.length === 0) {
        setErrorMsg(`請選擇「${group.title}」（至少選 1 個，最多 ${group.limit_number} 個）`);
        return;
      }
    }

    const cartItemPayload: CartItem = {
      cartItemId: existingCartItem ? existingCartItem.cartItemId : `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      storeId,
      storeName,
      name: item.name,
      unitPrice: item.price,
      quantity,
      selectedOptions: formattedSelectedOptions,
      customNotes,
      totalPrice: itemTotalPrice,
      rawCustomSelections: selectedOptions,
    };

    if (existingCartItem && onUpdateCartItem) {
      onUpdateCartItem(cartItemPayload);
    } else {
      onAddToCart(cartItemPayload);
      // 清除草稿
      localStorage.removeItem(`menu_app_draft_${item.id}`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Modal 頂部標題 */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{item.name}</span>
              {existingCartItem && (
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  修改規格
                </span>
              )}
            </h3>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-extrabold mt-0.5">
              基本單價 ${item.price} 元起
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center text-sm font-bold active:scale-95 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 草稿恢復提示條 */}
        {hasDraft && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <span className="font-bold">📋 偵測到上次選到一半的草稿</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="bg-amber-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] hover:bg-amber-600 transition cursor-pointer"
              >
                恢復選擇
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] cursor-pointer"
              >
                捨棄
              </button>
            </div>
          </div>
        )}

        {/* 錯誤警告 */}
        {errorMsg && (
          <div className="mx-4 mt-3 bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-300 text-xs font-bold p-2.5 rounded-xl border border-red-100 dark:border-rose-900/60 flex items-center gap-1.5 animate-shake">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 客製選項主體 (即時呈現，零延遲) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
          {customGroups.length > 0 &&
            customGroups.map((group) => {
              const currentSelected = selectedOptions[group.id] || [];
              return (
                <div key={group.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1">
                      <span>{group.title}</span>
                      {group.type === 'single' && <span className="text-sky-500">*</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                      {group.type === 'single' && '必選 1 個'}
                      {group.type === 'any' && '可多選或不選'}
                      {group.type === 'limit' && `最多選 ${group.limit_number || 1} 個`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isChecked = currentSelected.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(group, opt.id)}
                          className={`p-2.5 rounded-2xl text-xs font-bold border text-left transition flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                            isChecked
                              ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="truncate mr-1">{opt.name}</span>
                          {opt.price_adjustment > 0 ? (
                            <span
                              className={`text-[10px] font-extrabold shrink-0 ${
                                isChecked ? 'text-white' : 'text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              +${opt.price_adjustment}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] ${
                                isChecked ? 'text-sky-100' : 'text-slate-400 dark:text-slate-400'
                              }`}
                            >
                              +0
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* 特製備註輸入框 */}
          <div className="pt-3 space-y-1.5">
            <label htmlFor="custom-notes-input" className="text-xs font-bold text-slate-700 dark:text-slate-200">
              特製備註 (選填)
            </label>
            <input
              id="custom-notes-input"
              name="customNotes"
              type="text"
              placeholder="有其他個人需求嗎？填寫備註..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 購買數量調整 */}
          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">購買數量</span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-100">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Modal 底部結算與按鈕 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">合計金額</span>
            <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">${itemTotalPrice} 元</span>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition active:scale-[0.99] flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{existingCartItem ? '儲存修改' : '加入購物車'}</span>
            <span>(${itemTotalPrice} 元)</span>
          </button>
        </div>
      </div>
    </div>
  );
}