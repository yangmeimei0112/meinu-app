'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MultiStoreCart, CartItem } from '@/types/cart';
import { MenuItem, GroupOrder, Store } from '@/types/database';
import { mergeCartItems } from '@/lib/useMultiCart';

export function useCartPage() {
  const [multiCart, setMultiCart] = useState<MultiStoreCart>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('menu_app_multi_cart');
        return saved ? JSON.parse(saved) : {};
      } catch {}
    }
    return {};
  });

  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('menu_app_multi_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          const keys = Object.keys(parsed);
          if (keys.length > 0) return keys[0];
        }
      } catch {}
    }
    return '';
  });

  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrder | null>(null);
  const [activeStoreData, setActiveStoreData] = useState<Store | null>(null);
  const [clearConfirmModal, setClearConfirmModal] = useState<{
    isOpen: boolean;
    storeId: string;
    storeName: string;
  }>({
    isOpen: false,
    storeId: '',
    storeName: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('menu_app_multi_cart');
    if (saved) {
      try {
        const parsed: MultiStoreCart = JSON.parse(saved);
        setMultiCart(parsed);
        const storeIds = Object.keys(parsed);
        if (storeIds.length > 0 && !activeStoreId) {
          setActiveStoreId(storeIds[0]);
        }
      } catch (e) {
        console.error('讀取購物車失敗', e);
      }
    }
  }, [activeStoreId]);

  // 抓取當前店家即時營運設定與團購狀態
  useEffect(() => {
    if (!activeStoreId) {
      setActiveGroupOrder(null);
      setActiveStoreData(null);
      return;
    }

    async function fetchStoreAndGroupInfo() {
      const [storeRes, groupRes] = await Promise.all([
        supabase
          .from('stores')
          .select('*')
          .eq('id', activeStoreId)
          .maybeSingle(),
        supabase
          .from('group_orders')
          .select('*')
          .eq('store_id', activeStoreId)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (storeRes.data) {
        setActiveStoreData(storeRes.data as Store);
      }

      if (groupRes.data && groupRes.data.length > 0) {
        setActiveGroupOrder(groupRes.data[0] as GroupOrder);
      } else {
        setActiveGroupOrder(null);
      }
    }

    fetchStoreAndGroupInfo();
  }, [activeStoreId]);

  const isStoreAccepting = useMemo(() => {
    if (!activeStoreData) return true;
    if (activeStoreData.is_accepting_orders === false) return false;
    if (activeStoreData.enable_countdown && activeStoreData.cutoff_time) {
      if (new Date(activeStoreData.cutoff_time).getTime() <= Date.now()) {
        return false;
      }
    }
    return true;
  }, [activeStoreData]);

  const saveMultiCart = (updated: MultiStoreCart) => {
    setMultiCart(updated);
    localStorage.setItem('menu_app_multi_cart', JSON.stringify(updated));
  };

  const handleUpdateQuantity = (storeId: string, cartItemId: string, delta: number) => {
    const updated = { ...multiCart };
    const group = updated[storeId];
    if (!group) return;

    group.items = group.items
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const singlePrice = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            totalPrice: singlePrice * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    if (group.items.length === 0) {
      delete updated[storeId];
      const remainingStoreIds = Object.keys(updated);
      setActiveStoreId(remainingStoreIds[0] || '');
    }

    saveMultiCart(updated);
  };

  const handleRemoveItem = (storeId: string, cartItemId: string) => {
    const updated = { ...multiCart };
    const group = updated[storeId];
    if (!group) return;

    group.items = group.items.filter((item) => item.cartItemId !== cartItemId);
    if (group.items.length === 0) {
      delete updated[storeId];
      const remainingStoreIds = Object.keys(updated);
      setActiveStoreId(remainingStoreIds[0] || '');
    }

    saveMultiCart(updated);
  };

  const handleClearStoreCart = (storeId: string) => {
    const group = multiCart[storeId];
    if (!group) return;

    setClearConfirmModal({
      isOpen: true,
      storeId,
      storeName: group.storeName,
    });
  };

  const handleConfirmClearStore = () => {
    const updated = { ...multiCart };
    delete updated[clearConfirmModal.storeId];
    const remainingStoreIds = Object.keys(updated);
    setActiveStoreId(remainingStoreIds[0] || '');
    saveMultiCart(updated);
    setClearConfirmModal({ isOpen: false, storeId: '', storeName: '' });
  };

  const handleStartEditItem = async (cartItem: CartItem) => {
    setEditingCartItem(cartItem);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', cartItem.menuItemId)
        .single();

      if (!error && data) {
        setEditingMenuItem(data as MenuItem);
      } else {
        setEditingMenuItem({
          id: cartItem.menuItemId,
          store_id: cartItem.storeId,
          name: cartItem.name,
          price: cartItem.unitPrice,
          description: null,
          is_sold_out: false,
          stock_quantity: null,
          custom_groups: null,
        });
      }
    } catch {
      setEditingMenuItem({
        id: cartItem.menuItemId,
        store_id: cartItem.storeId,
        name: cartItem.name,
        price: cartItem.unitPrice,
        description: null,
        is_sold_out: false,
        stock_quantity: null,
        custom_groups: null,
      });
    }
  };

  const handleSaveEditedItem = (newItem: CartItem) => {
    if (!editingCartItem) return;

    const updated = { ...multiCart };
    const group = updated[editingCartItem.storeId];
    if (!group) return;

    const existingIndex = group.items.findIndex(
      (item) => item.cartItemId === editingCartItem.cartItemId
    );

    if (existingIndex !== -1) {
      const otherItems = group.items.filter(
        (item) => item.cartItemId !== editingCartItem.cartItemId
      );
      group.items = mergeCartItems([...otherItems, newItem]);
    }

    saveMultiCart(updated);
    setEditingCartItem(null);
    setEditingMenuItem(null);
  };

  const storeIds = Object.keys(multiCart);
  const currentGroup = activeStoreId ? multiCart[activeStoreId] : null;
  const currentStoreTotal = (currentGroup?.items || []).reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  return {
    multiCart,
    storeIds,
    activeStoreId,
    setActiveStoreId,
    currentGroup,
    currentStoreTotal,
    editingCartItem,
    editingMenuItem,
    setEditingCartItem,
    setEditingMenuItem,
    activeGroupOrder,
    isStoreAccepting,
    clearConfirmModal,
    setClearConfirmModal,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearStoreCart,
    handleConfirmClearStore,
    handleStartEditItem,
    handleSaveEditedItem,
  };
}
