'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import CustomModal from '@/components/CustomModal';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';
import { supabase } from '@/lib/supabase';
import { MultiStoreCart, CartItem } from '@/types/cart';
import { MenuItem, GroupOrder } from '@/types/database';

export default function MultiCartPage() {
  const [multiCart, setMultiCart] = useState<MultiStoreCart>({});
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrder | null>(null);

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

  // 抓取當前店家開放中的團購活動（取得預算上限與狀態）
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
      const remainingIds = Object.keys(updated);
      setActiveStoreId(remainingIds[0] || '');
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
      const remainingIds = Object.keys(updated);
      setActiveStoreId(remainingIds[0] || '');
    }

    saveMultiCart(updated);
  };

  const handleClearStoreCart = (storeId: string) => {
    if (!confirm('⚠️ 確定要清空這間店家的購物車嗎？')) return;
    const updated = { ...multiCart };
    delete updated[storeId];
    const remainingIds = Object.keys(updated);
    setActiveStoreId(remainingIds[0] || '');
    saveMultiCart(updated);
  };

  // ✏️ 快速在購物車中修改餐點規格 (Edit in Cart)
  const handleStartEditItem = async (item: CartItem) => {
    // 取得原始餐點資料以獲取 custom_groups
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', item.menuItemId)
      .single();

    if (menuData) {
      setEditingMenuItem(menuData as MenuItem);
    } else {
      // 找不到時以現有資料組裝
      setEditingMenuItem({
        id: item.menuItemId,
        store_id: item.storeId,
        name: item.name,
        price: item.unitPrice,
        description: null,
        is_sold_out: false,
        stock_quantity: null,
      });
    }
    setEditingCartItem(item);
  };

  const handleSaveEditedItem = (updatedItem: CartItem) => {
    const updated = { ...multiCart };
    const group = updated[updatedItem.storeId];
    if (!group) return;

    group.items = group.items.map((item) =>
      item.cartItemId === updatedItem.cartItemId ? updatedItem : item
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-200">
      <OfflineBanner />
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
        >
          ‹ 返回「咩nu」大廳
        </Link>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>🛒 我的獨立購物車</span>
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
            共 {storeIds.length} 間店家
          </span>
        </div>

        {storeIds.length === 0 ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="text-4xl">🛍️</div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">目前所有店家的購物車都是空的喔！</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">快前往大廳挑選喜歡的店家吧！</p>
            <Link
              href="/"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl shadow-xs transition active:scale-95"
            >
              前往點餐大廳 ➔
            </Link>
          </div>
        ) : (
          <>
            {/* 店家購物車頁籤切換 (Foodpanda / Uber Eats 樣式) */}
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
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                      isActive
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                        : 'bg-white dark:bg-[#131B2B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#182338]'
                    }`}
                  >
                    <span>🥤 {group.storeName}</span>
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
              <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>🥤 {currentGroup.storeName}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-400">一店一車，獨立選購與結帳送單</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearStoreCart(activeStoreId)}
                    className="text-xs text-slate-400 hover:text-red-500 font-semibold transition"
                  >
                    清空此店
                  </button>
                </div>

                {/* 個人預算補貼提醒 */}
                {activeGroupOrder?.enable_budget_limit &&
                  activeGroupOrder?.budget_limit_amount && (
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
                              {item.selectedOptions
                                .map((opt) => `${opt.groupTitle}: ${opt.itemName}`)
                                .join(' / ')}
                            </p>
                          )}
                          {item.customNotes && (
                            <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                              備註：{item.customNotes}
                            </p>
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
                          onClick={() => handleStartEditItem(item)}
                          className="text-[11px] font-bold text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 border border-sky-100 dark:border-slate-700 px-2.5 py-1 rounded-xl transition flex items-center gap-1 active:scale-95"
                        >
                          <span>✏️ 修改規格</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(activeStoreId, item.cartItemId)
                            }
                            className="text-xs text-slate-300 hover:text-red-500 px-1 py-1 transition"
                            title="刪除品項"
                          >
                            🗑️
                          </button>

                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(activeStoreId, item.cartItemId, -1)
                              }
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-100">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(activeStoreId, item.cartItemId, 1)
                              }
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center"
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
                    {/* ‹ 繼續點餐按鈕：直達該店家菜單頁面 */}
                    <Link
                      href={`/stores/${activeStoreId}`}
                      className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold text-xs py-3 rounded-2xl border border-sky-100 dark:border-slate-700 text-center transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>‹ 繼續點餐 (回菜單)</span>
                    </Link>

                    {/* 前往結帳按鈕 */}
                    <Link
                      href={`/checkout?storeId=${activeStoreId}`}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-xs py-3 rounded-2xl text-center shadow-md transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>前往結帳 ➔</span>
                    </Link>
                  </div>
                </div>
              </div>
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
    </div>
  );
}