'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CustomGroup } from '@/types/database';
import { CartItem, SelectedOption } from '@/types/cart';
import { useCustomModalDraft } from './useCustomModalDraft';

interface UseCustomModalStateProps {
  item: MenuItem | null;
  storeId: string;
  storeName: string;
  existingCartItem?: CartItem | null;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  onUpdateCartItem?: (updatedItem: CartItem) => void;
}

export function useCustomModalState({
  item,
  storeId,
  storeName,
  existingCartItem,
  onClose,
  onAddToCart,
  onUpdateCartItem,
}: UseCustomModalStateProps) {
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
    const currentItemId = item.id;
    let isMounted = true;

    async function fetchLatestGroups() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('custom_groups')
          .eq('id', currentItemId)
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
      const option = group.options.find((opt) => opt.id === id);
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

  const singleUnitPrice = (item?.price || 0) + totalExtraPrice;
  const itemTotalPrice = singleUnitPrice * quantity;

  const handleConfirm = () => {
    if (!item) return;

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

  return {
    customGroups,
    selectedOptions,
    quantity,
    setQuantity,
    customNotes,
    setCustomNotes,
    errorMsg,
    detectedDraft,
    restoredToast,
    singleUnitPrice,
    itemTotalPrice,
    handleRestoreDraft,
    handleDiscardDraft,
    markInteracted,
    handleSelectOption,
    handleConfirm,
  };
}
