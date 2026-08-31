'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, MultiStoreCart, StoreCartGroup, SelectedOption } from '@/types/cart';

const STORAGE_KEY = 'menu_app_multi_cart';
const CART_UPDATE_EVENT = 'menu_app_cart_updated';

/**
 * 🔍 精準比對兩個餐點品項是否為「完全相同規格」
 * 比對維度包含：
 * 1. 餐點 ID (menuItemId) 或名稱 (name)
 * 2. 顧客備註 (customNotes，前後去空白)
 * 3. 所有客製化加價選項 (selectedOptions，比對群組、選項名稱與加價金額)
 */
export function areCartItemsEqual(a: CartItem, b: CartItem): boolean {
  if (!a || !b) return false;

  // 1. 餐點識別碼一致
  const idA = a.menuItemId || a.name;
  const idB = b.menuItemId || b.name;
  if (idA !== idB) return false;

  // 2. 備註完全一致 (忽略前後空白)
  const notesA = (a.customNotes || '').trim();
  const notesB = (b.customNotes || '').trim();
  if (notesA !== notesB) return false;

  // 3. 客製化選項清單一致
  const optsA = a.selectedOptions || [];
  const optsB = b.selectedOptions || [];
  if (optsA.length !== optsB.length) return false;

  const keyA = optsA
    .map((o: SelectedOption) => `${o.groupTitle || ''}:${o.itemName || ''}:${Number(o.extraPrice || 0)}`)
    .sort()
    .join('|');
  const keyB = optsB
    .map((o: SelectedOption) => `${o.groupTitle || ''}:${o.itemName || ''}:${Number(o.extraPrice || 0)}`)
    .sort()
    .join('|');

  return keyA === keyB;
}

/**
 * 🛒 將購物車品項列表中的重複相同規格項目自動合併，數量累加
 */
export function mergeCartItems(items: CartItem[]): CartItem[] {
  if (!items || items.length === 0) return [];
  const merged: CartItem[] = [];

  for (const item of items) {
    const existingIndex = merged.findIndex((m) => areCartItemsEqual(m, item));
    if (existingIndex > -1) {
      const existing = merged[existingIndex];
      const newQty = existing.quantity + item.quantity;
      const singleUnitPrice =
        existing.quantity > 0
          ? Math.round(existing.totalPrice / existing.quantity)
          : item.unitPrice || Math.round(item.totalPrice / item.quantity);

      merged[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: singleUnitPrice * newQty,
      };
    } else {
      merged.push({ ...item });
    }
  }

  return merged;
}

/**
 * 讀取並自動規整多店家購物車（自動執行相同品項數量合併）
 */
function getStoredCart(): MultiStoreCart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: MultiStoreCart = JSON.parse(raw);

    // 自動規整每個店家的品項列表
    let hasChanges = false;
    const sanitized: MultiStoreCart = {};

    for (const [storeId, group] of Object.entries(parsed)) {
      if (group && Array.isArray(group.items)) {
        const merged = mergeCartItems(group.items);
        if (merged.length !== group.items.length) {
          hasChanges = true;
        }
        sanitized[storeId] = {
          ...group,
          items: merged,
        };
      }
    }

    if (hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      } catch {}
    }

    return sanitized;
  } catch (e) {
    console.error('讀取購物車失敗:', e);
    return {};
  }
}

function saveCart(cart: MultiStoreCart) {
  if (typeof window === 'undefined') return;
  try {
    // 儲存前確保所有店家品項皆已自動合併重複項目
    const sanitized: MultiStoreCart = {};
    for (const [storeId, group] of Object.entries(cart)) {
      if (group && Array.isArray(group.items)) {
        sanitized[storeId] = {
          ...group,
          items: mergeCartItems(group.items),
        };
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event(CART_UPDATE_EVENT));
  } catch (e) {
    console.error('儲存購物車失敗:', e);
  }
}

export function useMultiCart() {
  const [cart, setCart] = useState<MultiStoreCart>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化並同步自定義事件與跨分頁 storage 事件
  useEffect(() => {
    setCart(getStoredCart());
    setIsLoaded(true);

    const handleSync = () => {
      setCart(getStoredCart());
    };

    try {
      if (typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
        window.addEventListener(CART_UPDATE_EVENT, handleSync);
        window.addEventListener('storage', handleSync);
      }
    } catch {}

    return () => {
      try {
        if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
          window.removeEventListener(CART_UPDATE_EVENT, handleSync);
          window.removeEventListener('storage', handleSync);
        }
      } catch {}
    };
  }, []);

  // 🌟 新增或自動合併累加品項至指定店家購物車
  const addItem = useCallback((item: CartItem) => {
    const current = getStoredCart();
    const storeGroup: StoreCartGroup = current[item.storeId] || {
      storeId: item.storeId,
      storeName: item.storeName,
      items: [],
    };

    // 尋找完全相同規格 (餐點+客製化選項+備註) 的品項
    const existingIndex = storeGroup.items.findIndex((existing) => areCartItemsEqual(existing, item));

    if (existingIndex > -1) {
      const existing = storeGroup.items[existingIndex];
      const newQty = existing.quantity + item.quantity;
      const singleUnitPrice =
        existing.quantity > 0
          ? Math.round(existing.totalPrice / existing.quantity)
          : item.unitPrice || Math.round(item.totalPrice / item.quantity);

      storeGroup.items[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: singleUnitPrice * newQty,
      };
    } else {
      storeGroup.items.push(item);
    }

    // 再次確保無冗餘重複項目
    storeGroup.items = mergeCartItems(storeGroup.items);

    current[item.storeId] = storeGroup;
    saveCart(current);
    setCart(current);
  }, []);

  // 更新單一購物車品項數量 (若數量為 0 則自動移除)
  const updateItemQuantity = useCallback((storeId: string, cartItemId: string, newQty: number) => {
    const current = getStoredCart();
    const group = current[storeId];
    if (!group) return;

    if (newQty <= 0) {
      group.items = group.items.filter((i) => i.cartItemId !== cartItemId);
    } else {
      group.items = group.items.map((i) => {
        if (i.cartItemId === cartItemId) {
          const singleUnitPrice = i.quantity > 0 ? Math.round(i.totalPrice / i.quantity) : i.unitPrice;
          return {
            ...i,
            quantity: newQty,
            totalPrice: singleUnitPrice * newQty,
          };
        }
        return i;
      });
    }

    if (group.items.length === 0) {
      delete current[storeId];
    } else {
      group.items = mergeCartItems(group.items);
      current[storeId] = group;
    }

    saveCart(current);
    setCart(current);
  }, []);

  // 移除單一品項
  const removeItem = useCallback((storeId: string, cartItemId: string) => {
    const current = getStoredCart();
    const group = current[storeId];
    if (!group) return;

    group.items = group.items.filter((i) => i.cartItemId !== cartItemId);
    if (group.items.length === 0) {
      delete current[storeId];
    } else {
      current[storeId] = group;
    }

    saveCart(current);
    setCart(current);
  }, []);

  // 清空指定店家購物車
  const clearStoreCart = useCallback((storeId: string) => {
    const current = getStoredCart();
    delete current[storeId];
    saveCart(current);
    setCart(current);
  }, []);

  // 清空所有店家購物車
  const clearAllCart = useCallback(() => {
    saveCart({});
    setCart({});
  }, []);

  // 計算指定店家或全站總金額與數量
  const getStoreTotals = useCallback(
    (storeId: string) => {
      const group = cart[storeId];
      if (!group) return { totalCount: 0, totalAmount: 0 };
      const totalCount = group.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = group.items.reduce((sum, item) => sum + item.totalPrice, 0);
      return { totalCount, totalAmount };
    },
    [cart]
  );

  const getGlobalTotals = useCallback(() => {
    let totalCount = 0;
    let totalAmount = 0;
    Object.values(cart).forEach((group) => {
      group.items.forEach((item) => {
        totalCount += item.quantity;
        totalAmount += item.totalPrice;
      });
    });
    return { totalCount, totalAmount };
  }, [cart]);

  const totalCartItemCount = Object.values(cart).reduce(
    (acc, group) => acc + (group?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0),
    0
  );

  return {
    cart,
    isLoaded,
    totalCartItemCount,
    addItem,
    updateItemQuantity,
    removeItem,
    clearStoreCart,
    clearAllCart,
    getStoreTotals,
    getGlobalTotals,
  };
}
