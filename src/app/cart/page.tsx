'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { MultiStoreCart, CartItem } from '@/types/cart';

export default function MultiCartPage() {
  const [multiCart, setMultiCart] = useState<MultiStoreCart>({});
  const [activeStoreId, setActiveStoreId] = useState<string>('');

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

  const handleClearStoreCart = (storeId: string) => {
    const updated = { ...multiCart };
    delete updated[storeId];
    const remainingIds = Object.keys(updated);
    setActiveStoreId(remainingIds[0] || '');
    saveMultiCart(updated);
  };

  const storeIds = Object.keys(multiCart);
  const currentGroup = multiCart[activeStoreId];
  const currentStoreTotal = currentGroup
    ? currentGroup.items.reduce((sum, item) => sum + item.totalPrice, 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <OfflineBanner />
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-500 transition py-1"
        >
          ‹ 返回「咩nu」大廳
        </Link>

        <h2 className="text-xl font-extrabold text-slate-800">🛒 我的獨立購物車</h2>

        {storeIds.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 space-y-3 shadow-xs">
            <div className="text-4xl">🛍️</div>
            <p className="text-sm font-bold text-slate-700">目前所有店家的購物車都是空的喔！</p>
            <p className="text-xs text-slate-400">快前往大廳挑選喜歡的店家吧！</p>
            <Link
              href="/"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition"
            >
              前往點餐大廳 ➔
            </Link>
          </div>
        ) : (
          <>
            {/* 店家購物車頁籤切換 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {storeIds.map((sId) => {
                const group = multiCart[sId];
                const isActive = sId === activeStoreId;
                return (
                  <button
                    key={sId}
                    type="button"
                    onClick={() => setActiveStoreId(sId)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🥤 {group.storeName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white text-sky-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {group.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 當前選定店家購物車細節 */}
            {currentGroup && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      {currentGroup.storeName}
                    </h3>
                    <p className="text-[11px] text-slate-400">一店一購物車，獨立選購與結帳</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearStoreCart(activeStoreId)}
                    className="text-xs text-slate-400 hover:text-red-500 font-semibold transition"
                  >
                    清空此店
                  </button>
                </div>

                {/* 品項清單 */}
                <div className="divide-y divide-slate-100">
                  {currentGroup.items.map((item) => (
                    <div key={item.cartItemId} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                        <span className="text-sm font-extrabold text-sky-600">
                          ${item.totalPrice} 元
                        </span>
                      </div>

                      {item.selectedOptions.length > 0 && (
                        <p className="text-xs text-slate-400">
                          {item.selectedOptions
                            .map((opt) => `${opt.groupTitle}: ${opt.itemName}`)
                            .join(' / ')}
                        </p>
                      )}
                      {item.customNotes && (
                        <p className="text-xs text-amber-600">備註：{item.customNotes}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(activeStoreId, item.cartItemId, -1)
                            }
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateQuantity(activeStoreId, item.cartItemId, 1)
                            }
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between font-extrabold text-base text-slate-800">
                    <span>店家小計金額</span>
                    <span className="text-sky-600 text-lg">${currentStoreTotal} 元</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/stores/${activeStoreId}`}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-xs py-3 rounded-2xl border border-sky-100 text-center transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>‹ 繼續點菜 (回菜單)</span>
                    </Link>

                    <Link
                      href={`/checkout?storeId=${activeStoreId}`}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-3 rounded-2xl text-center shadow-md transition active:scale-95 flex items-center justify-center gap-1"
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
    </div>
  );
}