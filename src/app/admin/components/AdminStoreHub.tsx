'use client';

import React, { useState } from 'react';
import type { Category, MenuItem, PaymentMethod, SoldOutOption, Store } from '@/types/database';
import { Store as StoreIcon, Settings, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { AdminGlobalSettingsDrawer } from './store-hub/AdminGlobalSettingsDrawer';
import { AdminStoreCard } from './store-hub/AdminStoreCard';

interface AdminStoreHubProps {
  isDesktop: boolean;
  stores: Store[];
  categories: Category[];
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  onSelectStudioStore: (storeId: string) => void;
  onCreateStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (id: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, field: 'name', value: string) => void;
  onCreatePaymentMethod: () => void;
  onDeletePaymentMethod: (id: string) => void;
  onTogglePaymentMethodActive: (id: string, currentStatus: boolean) => void;
  onUpdatePaymentMethod: (id: string, field: 'name' | 'account_info', value: string | null) => void;
  onSavePaymentMethod: (id: string, payload: { name: string; account_info: string | null }) => void;
  onCreateSoldOutOption: () => void;
  onDeleteSoldOutOption: (id: string) => void;
  onMoveSoldOutOption: (id: string, direction: 'up' | 'down') => void;
  onUpdateSoldOutOption: (id: string, title: string) => void;
  onSaveSoldOutOption: (id: string, title: string) => void;
}

export default function AdminStoreHub({
  isDesktop,
  stores,
  categories,
  menuItems,
  paymentMethods,
  soldOutOptions,
  onSelectStudioStore,
  onCreateStore,
  onEditStore,
  onDeleteStore,
  onCreateCategory,
  onMoveCategory,
  onDeleteCategory,
  onUpdateCategory,
  onCreatePaymentMethod,
  onDeletePaymentMethod,
  onTogglePaymentMethodActive,
  onUpdatePaymentMethod,
  onSavePaymentMethod,
  onCreateSoldOutOption,
  onDeleteSoldOutOption,
  onMoveSoldOutOption,
  onUpdateSoldOutOption,
  onSaveSoldOutOption,
}: AdminStoreHubProps) {
  const [showGlobalSettings, setShowGlobalSettings] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* 👑 頂部店家總覽導覽列 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-50/90 via-white/95 to-indigo-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-sky-200/80 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(56,189,248,0.12)] space-y-4">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <StoreIcon className="w-5 h-5 text-sky-500" />
              <span>合作店家與菜單中心</span>
              <span className="text-xs font-black text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-3 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 shadow-2xs">
                共 {stores.length} 家門市
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              點擊任一門市卡片的「進入菜單設計」即可配置餐點、多層次規格選項與售罄狀態！
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-4 py-2 rounded-2xl border border-slate-200/90 dark:border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>全域設定 (分類 / 金流 / 缺貨)</span>
              {showGlobalSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onCreateStore}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-black px-4 py-2 rounded-2xl transition active:scale-95 shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增合作門市</span>
            </button>
          </div>
        </div>

        {/* 全域設定折疊抽屜 */}
        {showGlobalSettings && (
          <AdminGlobalSettingsDrawer
            categories={categories}
            paymentMethods={paymentMethods}
            soldOutOptions={soldOutOptions}
            onCreateCategory={onCreateCategory}
            onMoveCategory={onMoveCategory}
            onDeleteCategory={onDeleteCategory}
            onUpdateCategory={onUpdateCategory}
            onCreatePaymentMethod={onCreatePaymentMethod}
            onDeletePaymentMethod={onDeletePaymentMethod}
            onTogglePaymentMethodActive={onTogglePaymentMethodActive}
            onUpdatePaymentMethod={onUpdatePaymentMethod}
            onSavePaymentMethod={onSavePaymentMethod}
            onCreateSoldOutOption={onCreateSoldOutOption}
            onDeleteSoldOutOption={onDeleteSoldOutOption}
            onMoveSoldOutOption={onMoveSoldOutOption}
            onUpdateSoldOutOption={onUpdateSoldOutOption}
            onSaveSoldOutOption={onSaveSoldOutOption}
          />
        )}
      </div>

      {/* 合作門市卡片網格 */}
      {stores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0E1726]/90 p-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-3">
          <StoreIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
          <p className="font-extrabold text-sm text-slate-700 dark:text-slate-200">目前尚無任何合作店家</p>
          <p>請點擊上方按鈕新增第一家合作店家，開始建立菜單！</p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onCreateStore}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs px-4 py-2 rounded-2xl transition shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增合作門市</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={isDesktop ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
          {stores.map((store) => {
            const storeItemCount = menuItems.filter((i) => i.store_id === store.id).length;
            const storeActiveCount = menuItems.filter((i) => i.store_id === store.id && !i.is_sold_out).length;
            const catName = categories.find((c) => c.id === store.category_id)?.name || '未分類';

            return (
              <AdminStoreCard
                key={store.id}
                store={store}
                catName={catName}
                storeItemCount={storeItemCount}
                storeActiveCount={storeActiveCount}
                onSelectStudioStore={onSelectStudioStore}
                onEditStore={onEditStore}
                onDeleteStore={onDeleteStore}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
