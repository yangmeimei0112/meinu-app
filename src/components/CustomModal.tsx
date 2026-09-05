'use client';

import React from 'react';
import { MenuItem } from '@/types/database';
import { CartItem } from '@/types/cart';
import { useCustomModalState } from './custom-modal/useCustomModalState';
import { CustomModalOptionGroup } from './custom-modal/CustomModalOptionGroup';
import { CustomModalHeader } from './custom-modal/CustomModalHeader';
import { CustomModalDraftBanner } from './custom-modal/CustomModalDraftBanner';
import { CustomModalFooter } from './custom-modal/CustomModalFooter';

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
  const {
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
  } = useCustomModalState({
    item,
    storeId,
    storeName,
    existingCartItem,
    onClose,
    onAddToCart,
    onUpdateCartItem,
  });

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Modal 頂部標題 */}
        <CustomModalHeader
          name={item.name}
          price={singleUnitPrice}
          isEditMode={!!existingCartItem}
          onClose={onClose}
        />

        {/* 📋 草稿恢復提示與錯誤提示 */}
        <CustomModalDraftBanner
          detectedDraft={detectedDraft}
          restoredToast={restoredToast}
          errorMsg={errorMsg}
          onRestoreDraft={handleRestoreDraft}
          onDiscardDraft={handleDiscardDraft}
        />

        {/* 客製選項主體 */}
        <div className="p-4 overflow-y-auto scroll-touch overscroll-contain space-y-4 flex-1 text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
          {customGroups.length > 0 &&
            customGroups.map((group) => (
              <CustomModalOptionGroup
                key={group.id}
                group={group}
                basePrice={item.price}
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
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm sm:text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
        <CustomModalFooter
          itemTotalPrice={itemTotalPrice}
          isEditMode={!!existingCartItem}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}