'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CustomGroup } from '@/types/database';
import { CartItem, SelectedOption } from '@/types/cart';
import { useCustomModalDraft } from './custom-modal/useCustomModalDraft';
import { CustomModalOptionGroup } from './custom-modal/CustomModalOptionGroup';
import { History as IconHistory, Check as IconCheck, AlertCircle as IconAlertCircle, X } from 'lucide-react';

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

    const groups = item.custom_groups && Array.isArray(item.custom_groups) ? item.custom_groups : [];

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
            initializeStateAndDraft(mappedGroups);
          }
        });
    } else {
      setCustomGroups(groups);
      initializeStateAndDraft(groups);
    }

    function initializeStateAndDraft(currentGroups: CustomGroup[]) {
      if (existingCartItem && existingCartItem.rawCustomSelections) {
        setSelectedOptions(existingCartItem.rawCustomSelections);
        setDetectedDraft(null);
        return;
      }

      const initialSelections: Record<string, string[]> = {};
      currentGroups.forEach((g) => {
        initialSelections[g.id] = [];
      });
      setSelectedOptions(initialSelections);
      checkForDraft(currentGroups);
    }
  }, [item, existingCartItem, checkForDraft, setDetectedDraft]);

  if (!item) return null;

  const handleSelectOption = (group: CustomGroup, optionId: string) => {
    markInteracted();
    setErrorMsg(null);
    if (detectedDraft) setDetectedDraft(null);

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
              ${item.price} 元
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center active:scale-95 cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 📋 草稿恢復提示條 */}
        {detectedDraft && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200 gap-3">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
                <IconHistory className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>偵測到上次選到一半的草稿</span>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 truncate font-medium max-w-[210px] sm:max-w-[240px]">
                {detectedDraft.summaryText}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
              >
                恢復選擇
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] font-bold px-1.5 py-1 transition cursor-pointer"
              >
                捨棄
              </button>
            </div>
          </div>
        )}

        {/* ✅ 草稿恢復成功提示 */}
        {restoredToast && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900/60 px-4 py-2 flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold animate-in fade-in duration-150">
            <IconCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>已成功為您恢復上次選取的客製化草稿！</span>
          </div>
        )}

        {/* ⚠️ 錯誤警告 */}
        {errorMsg && (
          <div className="mx-4 mt-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-center gap-1.5 animate-shake">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 客製選項主體 */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
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
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
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