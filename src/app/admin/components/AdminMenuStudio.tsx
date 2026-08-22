'use client';

import React, { useState, useMemo } from 'react';
import type { Category, MenuItem, Store } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';

interface AdminMenuStudioProps {
  isDesktop: boolean;
  activeStudioStore: Store;
  categories: Category[];
  menuItems: MenuItem[];
  onBackToHub: () => void;
  onEditStore: (store: Store) => void;
  onCreateMenuItem: () => void;
  onEditMenuItem: (item: MenuItem) => void;
  onOpenBatchImportModal?: () => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleMenuItemActive: (id: string) => void;
}

export default function AdminMenuStudio({
  isDesktop,
  activeStudioStore,
  categories,
  menuItems,
  onBackToHub,
  onEditStore,
  onCreateMenuItem,
  onEditMenuItem,
  onOpenBatchImportModal,
  onDeleteMenuItem,
  onToggleMenuItemActive,
}: AdminMenuStudioProps) {
  const [productSearch, setProductSearch] = useState<string>('');
  const [itemStatusFilter, setItemStatusFilter] = useState<'all' | 'active' | 'sold_out'>('all');
  const debouncedProductSearch = useDebounce(productSearch, 180);

  const categoryName = categories.find((c) => c.id === activeStudioStore.category_id)?.name || '未分類';
  const studioMenuItems = useMemo(
    () => menuItems.filter((item) => item.store_id === activeStudioStore.id),
    [menuItems, activeStudioStore.id]
  );

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

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150">
      {/* 👑 頂部工作室橫幅 (Studio Banner) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-50/90 via-white/95 to-indigo-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-sky-200/80 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(56,189,248,0.12)] space-y-4">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100/90 dark:border-sky-900/40 pb-4 pl-2">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onBackToHub}
              className="inline-flex items-center gap-1.5 text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition group mb-1 cursor-pointer bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-xl border border-sky-100 dark:border-slate-700 shadow-2xs"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform font-black">‹</span>
              <span>返回店家列表</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-inner">
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
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{activeStudioStore.name}</span>
                  <span className="text-xs bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
                    {categoryName}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  專屬菜單設計工作室 &bull; 共 {studioMenuItems.length} 道餐點 ({activeItemCount} 道上架中)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pl-2 sm:pl-0">
            <button
              type="button"
              onClick={() => onEditStore(activeStudioStore)}
              className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>✏️ 店家資料</span>
            </button>

            {onOpenBatchImportModal && (
              <button
                type="button"
                onClick={onOpenBatchImportModal}
                className="bg-white/90 dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-black px-3.5 py-2 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 transition active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>📥 匯入 CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCreateMenuItem}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-black px-4 py-2 rounded-2xl transition active:scale-95 shadow-md shadow-sky-500/20 flex items-center gap-1 cursor-pointer"
            >
              <span>＋ 新增餐點品項</span>
            </button>
          </div>
        </div>

        {/* 🔍 搜尋與上下架過濾列 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pl-2">
          <div className="relative flex-1">
            <label htmlFor="crud-product-search-input" className="sr-only">
              搜尋餐點名稱或說明
            </label>
            <input
              id="crud-product-search-input"
              name="crudProductSearch"
              type="text"
              aria-label="搜尋餐點名稱或說明"
              placeholder={`🔍 搜尋「${activeStudioStore.name}」的餐點名稱或說明...`}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 pl-3.5 pr-8 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
            />
            {productSearch && (
              <button
                type="button"
                onClick={() => setProductSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl text-xs font-black shrink-0 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setItemStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                itemStatusFilter === 'all'
                  ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              全部 ({studioMenuItems.length})
            </button>
            <button
              type="button"
              onClick={() => setItemStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                itemStatusFilter === 'active'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              🟢 上架中 ({activeItemCount})
            </button>
            <button
              type="button"
              onClick={() => setItemStatusFilter('sold_out')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                itemStatusFilter === 'sold_out'
                  ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ⚪ 已下架 ({soldOutItemCount})
            </button>
          </div>
        </div>
      </div>

      {/* 🍔 菜單品項卡片清單 (Menu Cards Grid) */}
      {filteredStudioMenuItems.length === 0 ? (
        <div className="bg-white/90 dark:bg-[#0E1726]/90 rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-4xl">🥤</div>
          <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">目前尚無符合的餐點品項</h4>
          <p className="text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
            您可以點擊上方「＋ 新增餐點品項」設計新餐點與規格，或使用「📥 匯入 CSV」！
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={onCreateMenuItem}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs px-4 py-2 rounded-2xl transition shadow-xs active:scale-95 cursor-pointer"
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
              className={`rounded-3xl p-5 border space-y-3.5 flex flex-col justify-between transition-all duration-200 backdrop-blur-md ${
                !item.is_sold_out
                  ? 'bg-white/95 dark:bg-[#0E1726]/95 border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md'
                  : 'bg-slate-50/70 dark:bg-[#121622]/70 opacity-80 border-dashed border-slate-300 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2.5">
                {/* 標題、價格與上下架狀態切換 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-base truncate">{item.name}</h4>
                    <p className="text-sky-600 dark:text-sky-400 font-black text-base mt-0.5 font-mono">
                      ${item.price}{' '}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">元</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleMenuItemActive(item.id)}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full transition shrink-0 cursor-pointer shadow-2xs ${
                      !item.is_sold_out
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {!item.is_sold_out ? '🟢 上架中' : '⚪ 已下架'}
                  </button>
                </div>

                {/* 商品描述 */}
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-[#152033] p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 font-medium">
                    {item.description}
                  </p>
                )}

                {/* 客製化規格標籤展示 */}
                <div className="space-y-1 pt-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    規格群組 ({item.custom_groups?.length || 0} 組)：
                  </p>
                  {item.custom_groups && item.custom_groups.length > 0 ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {item.custom_groups.map((cg) => (
                        <span
                          key={cg.id}
                          className="text-[10px] bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold px-2.5 py-0.5 rounded-xl border border-sky-200/80 dark:border-sky-800/60"
                        >
                          {cg.title} ({cg.type === 'single' ? '單選' : '多選'} • {cg.options.length}項)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">固定規格（無額外選項）</p>
                  )}
                </div>
              </div>

              {/* 底部操作按鈕 */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onEditMenuItem(item)}
                  className="flex-1 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-black py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1 border border-sky-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
                >
                  <span>✏️ 編輯餐點與客製規格</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteMenuItem(item.id)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center font-bold text-xs transition cursor-pointer"
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
