'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, MultiStoreCart, StoreCartGroup } from '@/types/cart';

const STORAGE_KEY = 'menu_app_multi_cart';
const CART_UPDATE_EVENT = 'menu_app_cart_updated';

function getStoredCart(): MultiStoreCart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('讀取購物車失敗:', e);
    return {};
  }
}

function saveCart(cart: MultiStoreCart) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
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

  // 新增或累加品項至指定店家購物車
  const addItem = useCallback((item: CartItem) => {
    const current = getStoredCart();
    const storeGroup: StoreCartGroup = current[item.storeId] || {
      storeId: item.storeId,
      storeName: item.storeName,
      items: [],
    };

    // 尋找完全相同規格的品項
    const existingIndex = storeGroup.items.findIndex(
      (existing) =>
        existing.menuItemId === item.menuItemId &&
        existing.customNotes === item.customNotes &&
        JSON.stringify(existing.selectedOptions) === JSON.stringify(item.selectedOptions)
    );

    if (existingIndex > -1) {
      const existing = storeGroup.items[existingIndex];
      const newQty = existing.quantity + item.quantity;
      storeGroup.items[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalPrice: existing.unitPrice * newQty,
      };
    } else {
      storeGroup.items.push(item);
    }

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
      group.items = group.items.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: newQty, totalPrice: i.unitPrice * newQty }
          : i
      );
    }

    if (group.items.length === 0) {
      delete current[storeId];
    } else {
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

  // 清空全站所有購物車
  const clearAllCarts = useCallback(() => {
    saveCart({});
    setCart({});
  }, []);

  // 計算指定店家的總金額與總件數
  const getStoreSummary = useCallback(
    (storeId: string) => {
      const group = cart[storeId];
      if (!group) return { itemCount: 0, totalAmount: 0 };
      const itemCount = group.items.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = group.items.reduce((sum, i) => sum + i.totalPrice, 0);
      return { itemCount, totalAmount };
    },
    [cart]
  );

  // 計算所有店家的總件數
  const totalCartItemCount = Object.values(cart).reduce(
    (total, group) => total + group.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  return {
    cart,
    isLoaded,
    addItem,
    updateItemQuantity,
    removeItem,
    clearStoreCart,
    clearAllCarts,
    getStoreSummary,
    totalCartItemCount,
  };
}
