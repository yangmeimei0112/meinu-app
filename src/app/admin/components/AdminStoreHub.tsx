'use client';

import React, { useState } from 'react';
import type { Category, MenuItem, PaymentMethod, SoldOutOption, Store } from '@/types/database';

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
  const [globalSettingTab, setGlobalSettingTab] = useState<'categories' | 'payments' | 'sold_outs'>('categories');

  return (
    <div className="space-y-5">
      {/* 頂部店家總覽導覽列 */}
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🏪 合作店家總覽</span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-transparent dark:border-slate-700">
                共 {stores.length} 家合作門市
              </span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              點擊任一門市卡片的「🛠️ 進入菜單設計」即可開始設定該店菜單與客製化規格！
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-transparent dark:border-slate-700 transition active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>⚙️ 全域設定 (分類/金流/缺貨)</span>
              <span className="text-[10px]">{showGlobalSettings ? '▲' : '▼'}</span>
            </button>

            <button
              type="button"
              onClick={onCreateStore}
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>＋ 新增合作門市</span>
            </button>
          </div>
        </div>

        {/* 全域設定折疊卡片 */}
        {showGlobalSettings && (
          <div className="bg-slate-50 dark:bg-[#182234] rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 max-w-sm border border-transparent dark:border-slate-700">
              <button
                type="button"
                onClick={() => setGlobalSettingTab('categories')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  globalSettingTab === 'categories'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                    : ''
                }`}
              >
                🏷️ 商品分類 ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setGlobalSettingTab('payments')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  globalSettingTab === 'payments'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                    : ''
                }`}
              >
                💳 付款方式 ({paymentMethods.length})
              </button>
              <button
                type="button"
                onClick={() => setGlobalSettingTab('sold_outs')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  globalSettingTab === 'sold_outs'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs'
                    : ''
                }`}
              >
                ⚠️ 缺貨備案 ({soldOutOptions.length})
              </button>
            </div>

            {/* 1. 全域分類管理 */}
            {globalSettingTab === 'categories' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">商品分類清單</span>
                  <button
                    type="button"
                    onClick={onCreateCategory}
                    className="text-[11px] font-bold bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    ＋ 新增分類
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white dark:bg-[#131B2B] p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <input
                        id={`cat-item-${cat.id}`}
                        name={`category_${cat.id}_name`}
                        aria-label={`分類名稱 ${cat.name}`}
                        value={cat.name}
                        onChange={(e) => onUpdateCategory(cat.id, 'name', e.target.value)}
                        className="flex-1 text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onMoveCategory(cat.id, 'up')}
                        className="text-xs text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-5 h-5 cursor-pointer"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveCategory(cat.id, 'down')}
                        className="text-xs text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-5 h-5 cursor-pointer"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-bold px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 全域付款方式管理 */}
            {globalSettingTab === 'payments' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">付款方式與收款帳號</span>
                  <button
                    type="button"
                    onClick={onCreatePaymentMethod}
                    className="text-[11px] font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    ＋ 新增付款方式
                  </button>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="bg-white dark:bg-[#131B2B] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          id={`pm-name-${method.id}`}
                          name={`payment_method_${method.id}_name`}
                          aria-label={`付款方式名稱 ${method.name}`}
                          value={method.name}
                          onChange={(e) => onUpdatePaymentMethod(method.id, 'name', e.target.value)}
                          className="font-bold text-xs text-slate-800 dark:text-slate-100 bg-transparent flex-1 focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onTogglePaymentMethodActive(method.id, method.is_active)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                              method.is_active
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {method.is_active ? '啟用' : '停用'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onSavePaymentMethod(method.id, {
                                name: method.name,
                                account_info: method.account_info,
                              })
                            }
                            className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-800/60 cursor-pointer"
                          >
                            儲存
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePaymentMethod(method.id)}
                            className="text-xs text-rose-500 font-bold px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <input
                        id={`pm-account-${method.id}`}
                        name={`payment_method_${method.id}_account`}
                        aria-label={`收款帳號或說明 ${method.name}`}
                        value={method.account_info ?? ''}
                        onChange={(e) => onUpdatePaymentMethod(method.id, 'account_info', e.target.value || null)}
                        placeholder="收款帳號或說明 (例如：(013) 123-456789)"
                        className="w-full text-xs bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. 全域缺貨備案管理 */}
            {globalSettingTab === 'sold_outs' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">遇缺貨備案清單</span>
                  <button
                    type="button"
                    onClick={onCreateSoldOutOption}
                    className="text-[11px] font-bold bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-amber-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    ＋ 新增備案
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {soldOutOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="bg-white dark:bg-[#131B2B] p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <input
                        id={`soldout-title-${opt.id}`}
                        name={`soldout_option_${opt.id}_title`}
                        aria-label={`缺貨備案名稱 ${opt.title}`}
                        value={opt.title}
                        onChange={(e) => onUpdateSoldOutOption(opt.id, e.target.value)}
                        className="flex-1 text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveSoldOutOption(opt.id, opt.title)}
                        className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-800/60 cursor-pointer"
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveSoldOutOption(opt.id, 'up')}
                        className="text-xs text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-5 h-5 cursor-pointer"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveSoldOutOption(opt.id, 'down')}
                        className="text-xs text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-5 h-5 cursor-pointer"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSoldOutOption(opt.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-bold px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 店家網格卡片清單 */}
      {stores.length === 0 ? (
        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-4xl">🏪</div>
          <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">目前尚無合作店家</h4>
          <p className="text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
            點擊上方「＋ 新增合作門市」建立第一家合作店家，隨後即可進入設計菜單！
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onCreateStore}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              ＋ 新增合作門市
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
              <div
                key={store.id}
                className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between transition hover:border-sky-200 dark:hover:border-sky-700 hover:shadow-lg group"
              >
                <div className="space-y-3">
                  {/* 店家封面與分類標籤 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-inner">
                      {store.image_url ? (
                        <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/60">
                          {catName}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 dark:text-slate-100 text-base mt-1 truncate">
                        {store.name}
                      </h3>
                    </div>
                  </div>

                  {/* 菜單規模數據 */}
                  <div className="bg-slate-50 dark:bg-[#182234] p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">菜單規模：</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                      共 {storeItemCount} 道餐點 ({storeActiveCount} 上架)
                    </span>
                  </div>
                </div>

                {/* 操作按鈕群 */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* 核心主要 CTA：進入菜單設計 */}
                  <button
                    type="button"
                    onClick={() => onSelectStudioStore(store.id)}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-extrabold text-xs py-2.5 rounded-2xl transition shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🛠️ 進入菜單設計 (Design Menu)</span>
                    <span className="text-sm">➔</span>
                  </button>

                  {/* 次要操作 */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onEditStore(store)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 rounded-xl border border-transparent dark:border-slate-700 transition cursor-pointer"
                    >
                      ✏️ 編輯基本資料
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStore(store.id)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-transparent dark:border-slate-700 transition cursor-pointer"
                    >
                      🗑️ 刪除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
