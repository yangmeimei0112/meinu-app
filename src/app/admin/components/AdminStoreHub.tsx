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
    <div className="space-y-6">
      {/* 👑 頂部店家總覽導覽列 (Commander Style Header) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-50/90 via-white/95 to-indigo-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-sky-200/80 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(56,189,248,0.12)] space-y-4">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span>🏪 合作店家與菜單中心</span>
              <span className="text-xs font-black text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-3 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 shadow-2xs">
                共 {stores.length} 家門市
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              點擊任一門市卡片的「🛠️ 進入菜單設計」即可配置餐點、多層次規格選項與售罄狀態！
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-4 py-2 rounded-2xl border border-slate-200/90 dark:border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>⚙️ 全域設定 (分類 / 金流 / 缺貨)</span>
              <span className="text-[10px]">{showGlobalSettings ? '▲' : '▼'}</span>
            </button>

            <button
              type="button"
              onClick={onCreateStore}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-black px-4 py-2 rounded-2xl transition active:scale-95 shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>＋ 新增合作門市</span>
            </button>
          </div>
        </div>

        {/* ⚙️ 全域設定折疊卡片 */}
        {showGlobalSettings && (
          <div className="bg-white/90 dark:bg-[#152033]/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
            <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl text-xs font-black text-slate-600 dark:text-slate-300 max-w-md border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setGlobalSettingTab('categories')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
                  globalSettingTab === 'categories'
                    ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                🏷️ 商品分類 ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setGlobalSettingTab('payments')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
                  globalSettingTab === 'payments'
                    ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                💳 付款方式 ({paymentMethods.length})
              </button>
              <button
                type="button"
                onClick={() => setGlobalSettingTab('sold_outs')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
                  globalSettingTab === 'sold_outs'
                    ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                    : 'hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                ⚠️ 缺貨備案 ({soldOutOptions.length})
              </button>
            </div>

            {/* 1. 全域分類管理 */}
            {globalSettingTab === 'categories' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">商品分類排序與管理</span>
                  <button
                    type="button"
                    onClick={onCreateCategory}
                    className="text-xs font-black bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer"
                  >
                    ＋ 新增分類
                  </button>
                </div>
                {categories.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    尚無商品分類，請點擊上方按鈕新增
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-slate-50 dark:bg-[#0E1726] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                      >
                        <input
                          id={`cat-item-${cat.id}`}
                          name={`category_${cat.id}_name`}
                          aria-label={`分類名稱 ${cat.name}`}
                          value={cat.name}
                          onChange={(e) => onUpdateCategory(cat.id, 'name', e.target.value)}
                          className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => onMoveCategory(cat.id, 'up')}
                          className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveCategory(cat.id, 'down')}
                          className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-black px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. 全域付款方式管理 */}
            {globalSettingTab === 'payments' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">付款方式與收款帳號 (支援自訂)</span>
                  <button
                    type="button"
                    onClick={onCreatePaymentMethod}
                    className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer"
                  >
                    ＋ 新增付款方式
                  </button>
                </div>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    尚無付款方式，請點擊上方按鈕新增
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="bg-slate-50 dark:bg-[#0E1726] p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            id={`pm-item-${method.id}`}
                            name={`pm_${method.id}_name`}
                            aria-label={`付款方式名稱 ${method.name}`}
                            value={method.name}
                            onChange={(e) => onUpdatePaymentMethod(method.id, 'name', e.target.value)}
                            className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => onTogglePaymentMethodActive(method.id, method.is_active)}
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border cursor-pointer ${
                              method.is_active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300'
                            }`}
                          >
                            {method.is_active ? '啟用中' : '已停用'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSavePaymentMethod(method.id, { name: method.name, account_info: method.account_info })}
                            className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            儲存
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePaymentMethod(method.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-black px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          placeholder="收款帳號或備註 (選填，例如：郵局 700-00000000000000)"
                          value={method.account_info || ''}
                          onChange={(e) => onUpdatePaymentMethod(method.id, 'account_info', e.target.value)}
                          className="w-full text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#152033] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. 全域缺貨備案管理 */}
            {globalSettingTab === 'sold_outs' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">缺貨備案選項設定</span>
                  <button
                    type="button"
                    onClick={onCreateSoldOutOption}
                    className="text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer"
                  >
                    ＋ 新增備案
                  </button>
                </div>
                {soldOutOptions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    尚無缺貨備案，請點擊上方按鈕新增
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {soldOutOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className="bg-slate-50 dark:bg-[#0E1726] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                      >
                        <input
                          id={`so-item-${opt.id}`}
                          name={`so_${opt.id}_title`}
                          aria-label={`缺貨備案 ${opt.title}`}
                          value={opt.title}
                          onChange={(e) => onUpdateSoldOutOption(opt.id, e.target.value)}
                          className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => onSaveSoldOutOption(opt.id, opt.title)}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          儲存
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveSoldOutOption(opt.id, 'up')}
                          className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveSoldOutOption(opt.id, 'down')}
                          className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSoldOutOption(opt.id)}
                          className="text-xs text-rose-500 hover:text-rose-700 font-black px-1.5 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🏪 合作門市卡片網格 (Store Cards Grid) */}
      {stores.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0E1726]/90 p-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-3">
          <div className="text-4xl">🏪</div>
          <p className="font-extrabold text-sm text-slate-700 dark:text-slate-200">目前尚無任何合作店家</p>
          <p>請點擊上方按鈕新增第一家合作店家，開始建立菜單！</p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onCreateStore}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs px-4 py-2 rounded-2xl transition shadow-xs active:scale-95 cursor-pointer"
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
                className="bg-white/95 dark:bg-[#0E1726]/95 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4 flex flex-col justify-between transition hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-lg group backdrop-blur-md"
              >
                <div className="space-y-3.5">
                  {/* 店家封面與分類標籤 */}
                  <div className="flex items-start justify-between gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-3xl overflow-hidden shrink-0 shadow-inner">
                      {store.image_url ? (
                        <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
                          {catName}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mt-1.5 truncate">
                        {store.name}
                      </h3>
                    </div>
                  </div>

                  {/* 菜單規模數據膠囊 */}
                  <div className="bg-slate-50 dark:bg-[#152033] p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">菜單品項：</span>
                    <span className="text-slate-900 dark:text-slate-100 font-black">
                      共 {storeItemCount} 道餐點 ({storeActiveCount} 上架中)
                    </span>
                  </div>
                </div>

                {/* 操作按鈕群 */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {/* 核心主要 CTA：進入菜單設計 */}
                  <button
                    type="button"
                    onClick={() => onSelectStudioStore(store.id)}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs py-2.5 rounded-2xl transition shadow-md shadow-sky-500/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🛠️ 進入菜單設計</span>
                    <span className="text-sm">➔</span>
                  </button>

                  {/* 次要操作 */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onEditStore(store)}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 transition cursor-pointer"
                    >
                      ✏️ 編輯資料
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStore(store.id)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-black px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 transition cursor-pointer"
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
