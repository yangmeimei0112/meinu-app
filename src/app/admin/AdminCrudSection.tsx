'use client';

import { useState, useMemo } from 'react';
import type { Category, MenuItem, PaymentMethod, SoldOutOption, Store } from '@/types/database';
import { AdminViewMode } from './admin-types';
import { useDebounce } from '@/lib/useDebounce';

interface AdminCrudSectionProps {
  viewMode?: AdminViewMode;
  stores: Store[];
  categories: Category[];
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  onCreateStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (id: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (id: string) => void;
  onCreateMenuItem: () => void;
  onEditMenuItem: (item: MenuItem) => void;
  onOpenBatchImportModal?: () => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleMenuItemActive: (id: string) => void;
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
  onUpdateCategory: (id: string, field: 'name', value: string) => void;
}

export function AdminCrudSection({
  viewMode = 'desktop',
  stores,
  categories,
  menuItems,
  paymentMethods,
  soldOutOptions,
  onCreateStore,
  onEditStore,
  onDeleteStore,
  onCreateCategory,
  onMoveCategory,
  onDeleteCategory,
  onCreateMenuItem,
  onEditMenuItem,
  onOpenBatchImportModal,
  onDeleteMenuItem,
  onToggleMenuItemActive,
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
  onUpdateCategory,
}: AdminCrudSectionProps) {
  // 控制是否進入特定店家的「專屬菜單工作室」
  const [activeStudioStoreId, setActiveStudioStoreId] = useState<string | null>(null);

  // 菜單工作室內的搜尋與上下架過濾
  const [productSearch, setProductSearch] = useState<string>('');
  const [itemStatusFilter, setItemStatusFilter] = useState<'all' | 'active' | 'sold_out'>('all');

  // 防抖搜尋
  const debouncedProductSearch = useDebounce(productSearch, 180);

  // 全域設定折疊面板開關
  const [showGlobalSettings, setShowGlobalSettings] = useState<boolean>(false);
  const [globalSettingTab, setGlobalSettingTab] = useState<'categories' | 'payments' | 'sold_outs'>('categories');

  const isDesktop = viewMode === 'desktop';
  const activeStudioStore = useMemo(() => stores.find((s) => s.id === activeStudioStoreId), [stores, activeStudioStoreId]);

  // 取得當前工作室店家的菜單品項
  const studioMenuItems = useMemo(() => menuItems.filter((item) => item.store_id === activeStudioStoreId), [menuItems, activeStudioStoreId]);
  
  const filteredStudioMenuItems = useMemo(() => {
    const query = debouncedProductSearch.trim().toLowerCase();
    return studioMenuItems.filter((item) => {
      const matchText =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query));
      if (!matchText) return false;

      if (itemStatusFilter === 'active') return !item.is_sold_out;
      if (itemStatusFilter === 'sold_out') return item.is_sold_out;
      return true;
    });
  }, [studioMenuItems, debouncedProductSearch, itemStatusFilter]);

  const activeItemCount = useMemo(() => studioMenuItems.filter((i) => !i.is_sold_out).length, [studioMenuItems]);
  const soldOutItemCount = useMemo(() => studioMenuItems.filter((i) => i.is_sold_out).length, [studioMenuItems]);

  // ==========================================
  // 第二層：🥤 專屬菜單設計工作室 (Store Menu Studio)
  // ==========================================
  if (activeStudioStore) {
    const categoryName = categories.find((c) => c.id === activeStudioStore.category_id)?.name || '未分類';

    return (
      <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* 頂部麵包屑與工作室橫幅 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveStudioStoreId(null);
                  setProductSearch('');
                  setItemStatusFilter('all');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-sky-600 hover:text-sky-700 transition group mb-1"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform font-bold">‹</span>
                <span>返回店家總覽列表</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-xl overflow-hidden shrink-0">
                  {activeStudioStore.image_url ? (
                    <img
                      src={activeStudioStore.image_url}
                      alt={activeStudioStore.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🏪'
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>{activeStudioStore.name}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                      {categoryName}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    專屬菜單設計工作室 • 共 {studioMenuItems.length} 道餐點 ({activeItemCount} 道上架中)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onEditStore(activeStudioStore)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95 flex items-center gap-1"
              >
                <span>✏️ 修改店家資訊</span>
              </button>

              {onOpenBatchImportModal && (
                <button
                  type="button"
                  onClick={onOpenBatchImportModal}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-sky-100 transition active:scale-95 shadow-2xs flex items-center gap-1"
                >
                  <span>📥 批量匯入 CSV</span>
                </button>
              )}

              <button
                type="button"
                onClick={onCreateMenuItem}
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95 shadow-xs flex items-center gap-1"
              >
                <span>＋ 新增餐點品項</span>
              </button>
            </div>
          </div>

          {/* 搜尋與上下架過濾列 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="crud-product-search-input" className="sr-only">搜尋餐點名稱或說明</label>
              <input
                id="crud-product-search-input"
                name="crudProductSearch"
                type="text"
                aria-label="搜尋餐點名稱或說明"
                placeholder={`🔍 搜尋「${activeStudioStore.name}」的餐點名稱或說明...`}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setItemStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  itemStatusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                全部 ({studioMenuItems.length})
              </button>
              <button
                type="button"
                onClick={() => setItemStatusFilter('active')}
                className={`px-3 py-1 rounded-lg transition ${
                  itemStatusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                🟢 上架中 ({activeItemCount})
              </button>
              <button
                type="button"
                onClick={() => setItemStatusFilter('sold_out')}
                className={`px-3 py-1 rounded-lg transition ${
                  itemStatusFilter === 'sold_out' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                ⚪ 已下架 ({soldOutItemCount})
              </button>
            </div>
          </div>
        </div>

        {/* 菜單品項卡片清單 */}
        {filteredStudioMenuItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 shadow-xs space-y-3">
            <div className="text-4xl">🥤</div>
            <h4 className="text-sm font-extrabold text-slate-700">目前尚無符合的餐點品項</h4>
            <p className="text-slate-400 max-w-xs mx-auto">
              您可以點擊上方「＋ 新增餐點品項」設計新餐點與規格，或使用「📥 批量匯入 CSV」！
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={onCreateMenuItem}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95"
              >
                ＋ 新增第一道餐點
              </button>
            </div>
          </div>
        ) : (
          <div className={isDesktop ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredStudioMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3 flex flex-col justify-between transition hover:border-sky-200 hover:shadow-md"
              >
                <div className="space-y-2">
                  {/* 標題、價格與上下架狀態切換 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-slate-800 text-base truncate">
                        {item.name}
                      </h4>
                      <p className="text-sky-600 font-black text-sm mt-0.5">
                        ${item.price} <span className="text-[10px] text-slate-400 font-normal">元</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleMenuItemActive(item.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition shrink-0 ${
                        !item.is_sold_out
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {!item.is_sold_out ? '🟢 上架中' : '⚪ 已下架'}
                    </button>
                  </div>

                  {/* 商品描述 */}
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl">
                      {item.description}
                    </p>
                  )}

                  {/* 客製化規格標籤展示 */}
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      客製化規格選項 ({item.custom_groups?.length || 0} 組)：
                    </p>
                    {item.custom_groups && item.custom_groups.length > 0 ? (
                      <div className="flex gap-1.5 flex-wrap">
                        {item.custom_groups.map((cg) => (
                          <span
                            key={cg.id}
                            className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2.5 py-1 rounded-xl border border-sky-100"
                          >
                            {cg.title} ({cg.type === 'single' ? '單選' : '多選'} • {cg.options.length}項)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">無客製化規格（固定規格）</p>
                    )}
                  </div>
                </div>

                {/* 底部操作按鈕 */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onEditMenuItem(item)}
                    className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1 border border-sky-100"
                  >
                    <span>✏️ 編輯餐點與客製規格</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteMenuItem(item.id)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center font-bold text-xs transition"
                    title="刪除餐點"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 第一層：🏪 合作店家管理總覽 (Store Hub)
  // ==========================================
  return (
    <div className="space-y-5">
      {/* 頂部店家總覽導覽列 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🏪 合作店家總覽</span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                共 {stores.length} 家合作門市
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              點擊任一門市卡片的「🛠️ 進入菜單設計」即可開始設定該店菜單與客製化規格！
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition active:scale-95 flex items-center gap-1"
            >
              <span>⚙️ 全域設定 (分類/金流/缺貨)</span>
              <span className="text-[10px]">{showGlobalSettings ? '▲' : '▼'}</span>
            </button>

            <button
              type="button"
              onClick={onCreateStore}
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition active:scale-95 shadow-xs flex items-center gap-1"
            >
              <span>＋ 新增合作門市</span>
            </button>
          </div>
        </div>

        {/* 全域設定折疊卡片 */}
        {showGlobalSettings && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold text-slate-600 max-w-sm">
              <button
                type="button"
                onClick={() => setGlobalSettingTab('categories')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  globalSettingTab === 'categories' ? 'bg-white text-slate-800 shadow-xs' : ''
                }`}
              >
                🏷️ 商品分類 ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setGlobalSettingTab('payments')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  globalSettingTab === 'payments' ? 'bg-white text-slate-800 shadow-xs' : ''
                }`}
              >
                💳 付款方式 ({paymentMethods.length})
              </button>
              <button
                type="button"
                onClick={() => setGlobalSettingTab('sold_outs')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  globalSettingTab === 'sold_outs' ? 'bg-white text-slate-800 shadow-xs' : ''
                }`}
              >
                ⚠️ 缺貨備案 ({soldOutOptions.length})
              </button>
            </div>

            {/* 1. 全域分類管理 */}
            {globalSettingTab === 'categories' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">商品分類清單</span>
                  <button
                    type="button"
                    onClick={onCreateCategory}
                    className="text-[11px] font-bold bg-white text-sky-700 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-sky-50"
                  >
                    ＋ 新增分類
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                      <input
                        id={`cat-item-${cat.id}`}
                        name={`category_${cat.id}_name`}
                        aria-label={`分類名稱 ${cat.name}`}
                        value={cat.name}
                        onChange={(e) => onUpdateCategory(cat.id, 'name', e.target.value)}
                        className="flex-1 text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onMoveCategory(cat.id, 'up')}
                        className="text-xs text-slate-400 hover:text-slate-700 w-5 h-5"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveCategory(cat.id, 'down')}
                        className="text-xs text-slate-400 hover:text-slate-700 w-5 h-5"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1"
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
                  <span className="text-[11px] font-bold text-slate-500">付款方式與收款帳號</span>
                  <button
                    type="button"
                    onClick={onCreatePaymentMethod}
                    className="text-[11px] font-bold bg-white text-emerald-700 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-emerald-50"
                  >
                    ＋ 新增付款方式
                  </button>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          id={`pm-name-${method.id}`}
                          name={`payment_method_${method.id}_name`}
                          aria-label={`付款方式名稱 ${method.name}`}
                          value={method.name}
                          onChange={(e) => onUpdatePaymentMethod(method.id, 'name', e.target.value)}
                          className="font-bold text-xs text-slate-800 bg-transparent flex-1 focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onTogglePaymentMethodActive(method.id, method.is_active)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              method.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {method.is_active ? '啟用' : '停用'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSavePaymentMethod(method.id, { name: method.name, account_info: method.account_info })}
                            className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md border border-sky-100"
                          >
                            儲存
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePaymentMethod(method.id)}
                            className="text-xs text-rose-500 font-bold px-1"
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
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
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
                  <span className="text-[11px] font-bold text-slate-500">遇缺貨備案清單</span>
                  <button
                    type="button"
                    onClick={onCreateSoldOutOption}
                    className="text-[11px] font-bold bg-white text-amber-800 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-amber-50"
                  >
                    ＋ 新增備案
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {soldOutOptions.map((opt) => (
                    <div key={opt.id} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                      <input
                        id={`soldout-title-${opt.id}`}
                        name={`soldout_option_${opt.id}_title`}
                        aria-label={`缺貨備案名稱 ${opt.title}`}
                        value={opt.title}
                        onChange={(e) => onUpdateSoldOutOption(opt.id, e.target.value)}
                        className="flex-1 text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveSoldOutOption(opt.id, opt.title)}
                        className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md border border-sky-100"
                      >
                        儲存
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveSoldOutOption(opt.id, 'up')}
                        className="text-xs text-slate-400 hover:text-slate-700 w-5 h-5"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveSoldOutOption(opt.id, 'down')}
                        className="text-xs text-slate-400 hover:text-slate-700 w-5 h-5"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSoldOutOption(opt.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold px-1"
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
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 shadow-xs space-y-3">
          <div className="text-4xl">🏪</div>
          <h4 className="text-sm font-extrabold text-slate-700">目前尚無合作店家</h4>
          <p className="text-slate-400 max-w-xs mx-auto">
            點擊上方「＋ 新增合作門市」建立第一家合作店家，隨後即可進入設計菜單！
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onCreateStore}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95"
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
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between transition hover:border-sky-200 hover:shadow-lg group"
              >
                <div className="space-y-3">
                  {/* 店家封面與分類標籤 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-inner">
                      {store.image_url ? (
                        <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        '🏪'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-100">
                          {catName}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 text-base mt-1 truncate">
                        {store.name}
                      </h3>
                    </div>
                  </div>

                  {/* 菜單規模數據 */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">菜單規模：</span>
                    <span className="text-slate-800 font-extrabold">
                      共 {storeItemCount} 道餐點 ({storeActiveCount} 上架)
                    </span>
                  </div>
                </div>

                {/* 操作按鈕群 */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* 核心主要 CTA：進入菜單設計 */}
                  <button
                    type="button"
                    onClick={() => setActiveStudioStoreId(store.id)}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-extrabold text-xs py-2.5 rounded-2xl transition shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>🛠️ 進入菜單設計 (Design Menu)</span>
                    <span className="text-sm">➔</span>
                  </button>

                  {/* 次要操作 */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onEditStore(store)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded-xl transition"
                    >
                      ✏️ 編輯基本資料
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStore(store.id)}
                      className="bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-bold px-3 py-1.5 rounded-xl transition"
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
