'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import CustomModal from '@/components/CustomModal';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { CartEmptyState } from './components/CartEmptyState';
import { CartStoreGroup } from './components/CartStoreGroup';
import { useCartPage } from './hooks/useCartPage';

export default function MultiCartPage() {
  const {
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
  } = useCartPage();

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
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
                const storeTotal = (group?.items || []).reduce((sum, item) => sum + item.totalPrice, 0);
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
                    <span>{group?.storeName}</span>
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
                isStoreAccepting={isStoreAccepting}
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
        onConfirm={handleConfirmClearStore}
        onCancel={() => setClearConfirmModal({ isOpen: false, storeId: '', storeName: '' })}
      />
    </div>
  );
}