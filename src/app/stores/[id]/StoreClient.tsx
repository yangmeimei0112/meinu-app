'use client';

import { useState, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import CustomModal from '@/components/CustomModal';
import CartBar from '@/components/CartBar';
import OfflineBanner from '@/components/OfflineBanner';
import LiveOrderCounter from '@/components/LiveOrderCounter';
import { MenuItem } from '@/types/database';
import { CartItem } from '@/types/cart';
import { useMultiCart } from '@/lib/useMultiCart';
import { useDebounce } from '@/lib/useDebounce';
import { useToast } from '@/lib/useToast';
import StoreProductCard from './components/StoreProductCard';
import { StoreHeader } from './components/StoreHeader';
import { StoreNoticeBanner } from './components/StoreNoticeBanner';
import { useStoreData } from './hooks/useStoreData';
import { Search, UtensilsCrossed } from 'lucide-react';

interface StoreClientProps {
  storeId: string;
  initialStoreCode?: string;
}

export default function StoreClient({ storeId, initialStoreCode }: StoreClientProps) {
  const {
    store,
    menuItems,
    groupMeta,
    loading,
    groupTotalAmount,
    popularCounts,
    countdownSeconds,
  } = useStoreData({ storeId, initialStoreCode });

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');

  const debouncedMenuSearch = useDebounce(menuSearchQuery, 200);
  const { cart, addItem, clearStoreCart } = useMultiCart();

  // P3-A：使用共用 useToast Hook
  const { toastMessage, showToast } = useToast();

  const handleShare = async () => {
    if (!store) return;
    const shareCode = store.code || store.id;
    const shareUrl = `${window.location.origin}/stores/${shareCode}`;
    const shareData = {
      title: `「${store.name}」團購點餐`,
      text: `大家好！這是「${store.name}」的專屬點餐連結，快來一起點餐湊單吧！`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          showToast(`已複製「${store.name}」點餐連結！`);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`「${store.name}」專屬揪團連結已複製！`);
    }
  };

  const currentStoreItems = useMemo(() => cart[storeId]?.items || [], [cart, storeId]);
  const currentStoreTotal = useMemo(
    () => currentStoreItems.reduce((sum, i) => sum + i.totalPrice, 0),
    [currentStoreItems]
  );

  // 記憶化餐點搜尋過濾結果
  const filteredMenuItems = useMemo(() => {
    const keyword = debouncedMenuSearch.trim().toLowerCase();
    if (!keyword) return menuItems;
    return menuItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(keyword);
      const descMatch = (item.description || '').toLowerCase().includes(keyword);
      return nameMatch || descMatch;
    });
  }, [menuItems, debouncedMenuSearch]);

  // 常態開放加購餐點至購物車
  const handleAddToCart = useCallback(
    (newItem: CartItem) => {
      addItem(newItem);
      showToast(`已將「${newItem.name}」加入購物車！`);
    },
    [addItem, showToast]
  );

  const handleClearStoreCart = useCallback(() => {
    clearStoreCart(storeId);
  }, [clearStoreCart, storeId]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(9.5rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3">
        {/* 店家抬頭資訊與分享 */}
        <StoreHeader store={store} onShare={handleShare} />

        {/* 即時訂單計數器 */}
        <LiveOrderCounter storeId={storeId} />

        {/* 店家即時公告、免運目標進度與截單倒數 */}
        <StoreNoticeBanner
          storeMeta={store || groupMeta}
          currentStoreTotal={currentStoreTotal}
          groupTotalAmount={groupTotalAmount}
          countdownSeconds={countdownSeconds}
        />

        {loading ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse border border-slate-100 dark:border-slate-800">
            正在載入菜單與全團點餐數據...
          </div>
        ) : !store ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            找不到該店家資訊
          </div>
        ) : (
          <div className="space-y-3">
            {/* 🔍 菜單內搜尋框 */}
            <div className="relative">
              <input
                type="text"
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                placeholder="搜尋此店家餐點名稱或特色..."
                aria-label="搜尋餐點"
                className="w-full bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {menuSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMenuSearchQuery('')}
                  aria-label="清除搜尋"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 🍽️ 餐點品項列表 */}
            {filteredMenuItems.length === 0 ? (
              // P2-D：搜尋無結果空狀態加入圖示，與其他頁面風格一致
              <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {menuSearchQuery ? `找不到符合「${menuSearchQuery}」的餐點` : '此店家目前尚未建立菜單品項喔！'}
                </p>
                {menuSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    className="text-xs text-sky-500 hover:text-sky-600 font-semibold transition"
                  >
                    清除搜尋條件
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMenuItems.map((item) => (
                  <StoreProductCard
                    key={item.id}
                    item={item}
                    popularQty={popularCounts[item.id] || 0}
                    onSelect={setSelectedMenuItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 底部購物車條 */}
      <CartBar
        cartItems={currentStoreItems}
        onClearCart={handleClearStoreCart}
      />

      {/* 客製規格彈窗 */}
      {selectedMenuItem && store && (
        <CustomModal
          item={selectedMenuItem}
          storeId={storeId}
          storeName={store.name}
          onClose={() => setSelectedMenuItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}