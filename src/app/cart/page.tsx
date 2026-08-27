'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import CustomModal from '@/components/CustomModal';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';
import { supabase } from '@/lib/supabase';
import { MultiStoreCart, CartItem } from '@/types/cart';
import { MenuItem, GroupOrder } from '@/types/database';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { CartEmptyState } from './components/CartEmptyState';
import { CartStoreGroup } from './components/CartStoreGroup';

export default function MultiCartPage() {
  const [multiCart, setMultiCart] = useState<MultiStoreCart>({});
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrder | null>(null);
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
        if (storeIds.length > 0) {
          setActiveStoreId(storeIds[0]);
        }
      } catch (e) {
        console.error('讀取購物車失敗', e);
      }
    }
  }, []);

  // 抓取當前店家開放中的團購活動
  useEffect(() => {
    if (!activeStoreId) {
      setActiveGroupOrder(null);
      return;
    }

    async function fetchGroupInfo() {
      const { data } = await supabase
        .from('group_orders')
        .select('*')
        .eq('store_id', activeStoreId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setActiveGroupOrder(data[0] as GroupOrder);
      } else {
        setActiveGroupOrder(null);
      }
    }

    fetchGroupInfo();
  }, [activeStoreId]);

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

    group.items = group.items.filter((i) => i.cartItemId !== cartItemId);
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

  const executeClearStoreCart = (storeId: string) => {
    const updated = { ...multiCart };
    delete updated[storeId];
    const remainingStoreIds = Object.keys(updated);
    setActiveStoreId(remainingStoreIds[0] || '');
    saveMultiCart(updated);
    setClearConfirmModal({ isOpen: false, storeId: '', storeName: '' });
  };

  // 開啟規格修改彈窗
  const handleStartEditItem = async (cartItem: CartItem) => {
    setEditingCartItem(cartItem);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', cartItem.menuItemId)
      .single();

    if (data) {
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
        custom_groups: [],
      });
    }
  };

  const handleSaveEditedItem = (updatedItem: CartItem) => {
    if (!editingCartItem) return;
    const storeId = editingCartItem.storeId;
    const updated = { ...multiCart };
    const group = updated[storeId];
    if (!group) return;

    group.items = group.items.map((i) =>
      i.cartItemId === editingCartItem.cartItemId ? updatedItem : i
    );
    saveMultiCart(updated);
    setEditingCartItem(null);
    setEditingMenuItem(null);
  };

  const storeIds = Object.keys(multiCart);
  const currentGroup = multiCart[activeStoreId];
  const currentStoreTotal = currentGroup
    ? currentGroup.items.reduce((sum, item) => sum + item.totalPrice, 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-24 transition-colors duration-200">
      <OfflineBanner />
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>返回「咩nu」大廳</span>
        </Link>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-sky-500" />
            <span>我的獨立購物車</span>
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
            共 {storeIds.length} 間店家
          </span>
        </div>

        {storeIds.length === 0 ? (
          <CartEmptyState />
        ) : (
          <>
            {/* 店家購物車頁籤切換 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {storeIds.map((sId) => {
                const group = multiCart[sId];
                const isActive = sId === activeStoreId;
                const storeTotal = group.items.reduce((sum, item) => sum + item.totalPrice, 0);
                return (
                  <button
                    key={sId}
                    type="button"
                    onClick={() => setActiveStoreId(sId)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                      isActive
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                        : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#182338]'
                    }`}
                  >
                    <span>{group.storeName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isActive
                          ? 'bg-white text-sky-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      ${storeTotal}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 當前選定店家購物車細節 */}
            {currentGroup && (
              <CartStoreGroup
                currentGroup={currentGroup}
                activeStoreId={activeStoreId}
                activeGroupOrder={activeGroupOrder}
                currentStoreTotal={currentStoreTotal}
                onClearStoreCart={handleClearStoreCart}
                onStartEditItem={handleStartEditItem}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
              />
            )}
          </>
        )}
      </main>

      {/* ✏️ 購物車內修改規格 Modal */}
      {editingCartItem && editingMenuItem && (
        <CustomModal
          item={editingMenuItem}
          storeId={editingCartItem.storeId}
          storeName={editingCartItem.storeName}
          existingCartItem={editingCartItem}
          onClose={() => {
            setEditingCartItem(null);
            setEditingMenuItem(null);
          }}
          onAddToCart={() => {}}
          onUpdateCartItem={handleSaveEditedItem}
        />
      )}

      {/* 清空店家購物車確認彈窗 */}
      <DoubleConfirmModal
        isOpen={clearConfirmModal.isOpen}
        title="清空店家購物車"
        message={`確定要清空「${clearConfirmModal.storeName}」購物車中的所有餐點嗎？此動作無法復原。`}
        confirmText="確定清空"
        cancelText="保留餐點"
        isDanger={true}
        onConfirm={() => executeClearStoreCart(clearConfirmModal.storeId)}
        onCancel={() => setClearConfirmModal({ isOpen: false, storeId: '', storeName: '' })}
      />
    </div>
  );
}