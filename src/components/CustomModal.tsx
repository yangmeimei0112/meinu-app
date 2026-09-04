'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CustomGroup } from '@/types/database';
import { CartItem, SelectedOption } from '@/types/cart';
import { useCustomModalDraft } from './custom-modal/useCustomModalDraft';
import { CustomModalOptionGroup } from './custom-modal/CustomModalOptionGroup';
import { CustomModalHeader } from './custom-modal/CustomModalHeader';
import { CustomModalDraftBanner } from './custom-modal/CustomModalDraftBanner';
import { CustomModalFooter } from './custom-modal/CustomModalFooter';

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
  const initialGroups = useMemo<CustomGroup[]>(() => {
    if (item?.custom_groups && Array.isArray(item.custom_groups)) {
      return item.custom_groups;
    }
    return [];
  }, [item]);

  const [prevItemId, setPrevItemId] = useState<string | null>(item?.id || null);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>(initialGroups);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState<number>(existingCartItem?.quantity || 1);
  const [customNotes, setCustomNotes] = useState<string>(existingCartItem?.customNotes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    detectedDraft,
    setDetectedDraft,
    restoredToast,
    setRestoredToast,
    checkForDraft,
    handleRestoreDraft,
    handleDiscardDraft,
    clearDraft,
    markInteracted,
  } = useCustomModalDraft({
    itemId: item?.id,
    isEditMode: !!existingCartItem,
    customGroups,
    selectedOptions,
    quantity,
    customNotes,
    setSelectedOptions,
    setQuantity,
    setCustomNotes,
    setErrorMsg,
  });

  // 🛡️ 若 item.id 改變，於渲染期同步重置狀態
  if (item && prevItemId !== item.id) {
    setPrevItemId(item.id);
    setCustomGroups(initialGroups);
    setSelectedOptions({});
    setQuantity(existingCartItem?.quantity || 1);
    setCustomNotes(existingCartItem?.customNotes || '');
    setErrorMsg(null);
    setDetectedDraft(null);
    setRestoredToast(false);
  }

  // 1. 規格初始化與草稿偵測
  useEffect(() => {
    if (!item) return;

    const initial: Record<string, string[]> = {};
    if (existingCartItem && existingCartItem.rawCustomSelections) {
      Object.assign(initial, existingCartItem.rawCustomSelections);
    } else if (existingCartItem && existingCartItem.selectedOptions) {
      existingCartItem.selectedOptions.forEach((opt) => {
        const matchedGroup = customGroups.find((g) => g.title === opt.groupTitle);
        if (matchedGroup) {
          const matchedItem = matchedGroup.options.find((i) => i.name === opt.itemName);
          if (matchedItem) {
            if (!initial[matchedGroup.id]) initial[matchedGroup.id] = [];
            initial[matchedGroup.id].push(matchedItem.id);
          }
        }
      });
    } else {
      customGroups.forEach((group) => {
        if (group.type === 'single' && group.options.length > 0) {
          initial[group.id] = [group.options[0].id];
        } else {
          initial[group.id] = [];
        }
      });
    }

    setSelectedOptions(initial);

    if (!existingCartItem) {
      checkForDraft(customGroups);
    }
  }, [item, customGroups, existingCartItem, checkForDraft]);

  // 2. 實時從資料庫同步最新規格
  useEffect(() => {
    if (!item?.id) return;
    let isMounted = true;

    async function fetchLatestGroups() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('custom_groups')
          .eq('id', item!.id)
          .single();

        if (!error && data?.custom_groups && isMounted) {
          setCustomGroups(data.custom_groups as CustomGroup[]);
        }
      } catch (err) {
        console.error('Failed to fetch latest custom groups', err);
      }
    }

    fetchLatestGroups();
    return () => {
      isMounted = false;
    };
  }, [item]);

  if (!item) return null;

  // 3. 處理選項切換
  const handleSelectOption = (group: CustomGroup, optionId: string) => {
    markInteracted();
    setErrorMsg(null);

    setSelectedOptions((prev) => {
      const current = prev[group.id] || [];

      if (group.type === 'single') {
        return { ...prev, [group.id]: [optionId] };
      }

      if (group.type === 'any') {
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [group.id]: [...current, optionId] };
        }
      }

      if (group.type === 'limit') {
        const max = group.limit_number || 1;
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
        } else {
          if (current.length >= max) {
            setErrorMsg(`此選項最多只能選擇 ${max} 項！`);
            return prev;
          }
          return { ...prev, [group.id]: [...current, optionId] };
        }
      }

      return prev;
    });
  };

  // 4. 計算總金額與結構化選項資料
  let totalExtraPrice = 0;
  const formattedSelectedOptions: SelectedOption[] = [];

  customGroups.forEach((group) => {
    const selectedIds = selectedOptions[group.id] || [];
    selectedIds.forEach((id) => {
      const option = group.options.find((item) => item.id === id);
      if (option) {
        totalExtraPrice += option.price_adjustment;
        formattedSelectedOptions.push({
          groupTitle: group.title,
          itemName: option.name,
          extraPrice: option.price_adjustment,
        });
      }
    });
  });

  const singleUnitPrice = item.price + totalExtraPrice;
  const itemTotalPrice = singleUnitPrice * quantity;

  const handleConfirm = () => {
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
      clearDraft();
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Modal 頂部標題 */}
        <CustomModalHeader
          name={item.name}
          price={item.price}
          isEditMode={!!existingCartItem}
          onClose={onClose}
        />

        {/* 📋 草稿恢復提示與錯誤提示 */}
        <CustomModalDraftBanner
          detectedDraft={detectedDraft}
          restoredToast={restoredToast}
          errorMsg={errorMsg}
          onRestoreDraft={handleRestoreDraft}
          onDiscardDraft={handleDiscardDraft}
        />

        {/* 客製選項主體 */}
        <div className="p-4 overflow-y-auto scroll-touch overscroll-contain space-y-4 flex-1 text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
          {customGroups.length > 0 &&
            customGroups.map((group) => (
              <CustomModalOptionGroup
                key={group.id}
                group={group}
                selectedOptionIds={selectedOptions[group.id] || []}
                onSelectOption={handleSelectOption}
              />
            ))}

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
              onChange={(e) => {
                markInteracted();
                setCustomNotes(e.target.value);
              }}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm sm:text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 購買數量調整 */}
          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">購買數量</span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  markInteracted();
                  setQuantity(Math.max(1, quantity - 1));
                }}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-100">{quantity}</span>
              <button
                type="button"
                onClick={() => {
                  markInteracted();
                  setQuantity(quantity + 1);
                }}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Modal 底部結算與按鈕 */}
        <CustomModalFooter
          itemTotalPrice={itemTotalPrice}
          isEditMode={!!existingCartItem}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}