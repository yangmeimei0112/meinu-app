'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Category, MenuItem, Store } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { AdminMenuStudioBanner } from './menu-studio/AdminMenuStudioBanner';
import { AdminMenuStudioToolbar } from './menu-studio/AdminMenuStudioToolbar';
import { AdminMenuItemCard } from './menu-studio/AdminMenuItemCard';
import { useMenuStudioDrag } from './menu-studio/useMenuStudioDrag';

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
  onReorderMenuItems?: (storeId: string, orderedItemIds: string[]) => void;
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
  onReorderMenuItems,
}: AdminMenuStudioProps) {
  const [productSearch, setProductSearch] = useState<string>('');
  const [itemStatusFilter, setItemStatusFilter] = useState<'all' | 'active' | 'sold_out'>('all');
  const debouncedProductSearch = useDebounce(productSearch, 180);

  const categoryName = categories.find((c) => c.id === activeStudioStore.category_id)?.name || '未分類';

  // 門市餐點原始清單
  const rawStudioMenuItems = useMemo(
    () => menuItems.filter((item) => item.store_id === activeStudioStore.id),
    [menuItems, activeStudioStore.id]
  );

  // 本地排序狀態
  const [orderedItems, setOrderedItems] = useState<MenuItem[]>(rawStudioMenuItems);

  // 🛡️ 防禦性狀態同步：只有在品項增刪或換店家時才重置，避免背景重抓將剛排好的順序覆蓋回彈
  useEffect(() => {
    setOrderedItems((prev) => {
      const prevIds = prev.map((i) => i.id).sort().join(',');
      const nextIds = rawStudioMenuItems.map((i) => i.id).sort().join(',');
      if (prevIds !== nextIds) {
        return rawStudioMenuItems;
      }
      return prev;
    });
  }, [rawStudioMenuItems]);

  // 儲存狀態指示：'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 🌟 提交排序並防抖持久化至後端
  const commitReorder = useCallback(
    (newItems: MenuItem[]) => {
      setOrderedItems(newItems);
      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const orderedIds = newItems.map((item) => item.id);
      saveTimeoutRef.current = setTimeout(() => {
        onReorderMenuItems?.(activeStudioStore.id, orderedIds);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }, 350);
    },
    [activeStudioStore.id, onReorderMenuItems]
  );

  // 手動立即儲存
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const orderedIds = orderedItems.map((item) => item.id);
    onReorderMenuItems?.(activeStudioStore.id, orderedIds);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [activeStudioStore.id, orderedItems, onReorderMenuItems]);

  // 🔍 搜尋與篩選邏輯
  const filteredStudioMenuItems = useMemo(() => {
    const query = debouncedProductSearch.trim().toLowerCase();
    return orderedItems.filter((item) => {
      const matchText =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query));
      if (!matchText) return false;

      if (itemStatusFilter === 'active') return !item.is_sold_out;
      if (itemStatusFilter === 'sold_out') return item.is_sold_out;
      return true;
    });
  }, [orderedItems, debouncedProductSearch, itemStatusFilter]);

  const isFiltering = !!debouncedProductSearch.trim() || itemStatusFilter !== 'all';
  const activeItemCount = useMemo(() => orderedItems.filter((i) => !i.is_sold_out).length, [orderedItems]);
  const soldOutItemCount = useMemo(() => orderedItems.filter((i) => i.is_sold_out).length, [orderedItems]);

  // 🎯 智慧微調與置頂/置底控制
  const handleMoveStep = useCallback(
    (itemId: string, direction: 'up' | 'down') => {
      if (isFiltering) {
        const currentFilteredIdx = filteredStudioMenuItems.findIndex((i) => i.id === itemId);
        if (currentFilteredIdx === -1) return;
        const targetFilteredIdx = direction === 'up' ? currentFilteredIdx - 1 : currentFilteredIdx + 1;
        if (targetFilteredIdx < 0 || targetFilteredIdx >= filteredStudioMenuItems.length) return;

        const targetItem = filteredStudioMenuItems[targetFilteredIdx];
        const fromIdx = orderedItems.findIndex((i) => i.id === itemId);
        const toIdx = orderedItems.findIndex((i) => i.id === targetItem.id);
        if (fromIdx === -1 || toIdx === -1) return;

        const newItems = [...orderedItems];
        const [moved] = newItems.splice(fromIdx, 1);
        newItems.splice(toIdx, 0, moved);
        commitReorder(newItems);
      } else {
        const currentIdx = orderedItems.findIndex((i) => i.id === itemId);
        if (currentIdx === -1) return;
        const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
        if (targetIdx < 0 || targetIdx >= orderedItems.length) return;

        const newItems = [...orderedItems];
        const [removed] = newItems.splice(currentIdx, 1);
        newItems.splice(targetIdx, 0, removed);
        commitReorder(newItems);
      }
    },
    [isFiltering, filteredStudioMenuItems, orderedItems, commitReorder]
  );

  const handleMoveToTop = useCallback(
    (itemId: string) => {
      const fromIdx = orderedItems.findIndex((i) => i.id === itemId);
      if (fromIdx <= 0) return;
      const newItems = [...orderedItems];
      const [moved] = newItems.splice(fromIdx, 1);
      newItems.unshift(moved);
      commitReorder(newItems);
    },
    [orderedItems, commitReorder]
  );

  const handleMoveToBottom = useCallback(
    (itemId: string) => {
      const fromIdx = orderedItems.findIndex((i) => i.id === itemId);
      if (fromIdx === -1 || fromIdx === orderedItems.length - 1) return;
      const newItems = [...orderedItems];
      const [moved] = newItems.splice(fromIdx, 1);
      newItems.push(moved);
      commitReorder(newItems);
    },
    [orderedItems, commitReorder]
  );

  // 🖐️ 手勢拖曳與長按 Hook
  const {
    activeDraggingId,
    dragOverItemId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useMenuStudioDrag({
    orderedItems,
    isFiltering,
    onCommitReorder: commitReorder,
  });

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150 relative select-none">
      {/* 👑 頂部工作室橫幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-sky-50/90 via-white/95 to-indigo-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-sky-200/80 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(56,189,248,0.12)] space-y-4">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-500" />

        <AdminMenuStudioBanner
          activeStudioStore={activeStudioStore}
          categoryName={categoryName}
          orderedItemsCount={orderedItems.length}
          activeItemCount={activeItemCount}
          onBackToHub={onBackToHub}
          onEditStore={onEditStore}
          onCreateMenuItem={onCreateMenuItem}
          onOpenBatchImportModal={onOpenBatchImportModal}
        />

        <AdminMenuStudioToolbar
          productSearch={productSearch}
          onSearchChange={setProductSearch}
          itemStatusFilter={itemStatusFilter}
          onFilterChange={setItemStatusFilter}
          totalCount={orderedItems.length}
          activeItemCount={activeItemCount}
          soldOutItemCount={soldOutItemCount}
          filteredCount={filteredStudioMenuItems.length}
          isFiltering={isFiltering}
          saveStatus={saveStatus}
          onManualSave={handleManualSave}
        />
      </div>

      {/* 菜單品項清單與網格 */}
      {filteredStudioMenuItems.length === 0 ? (
        <div className="bg-white/90 dark:bg-[#0E1726]/90 rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
          <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">目前尚無符合的餐點品項</h4>
          <p className="text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
            您可以點擊上方「新增餐點品項」設計新餐點與規格，或使用「匯入 CSV」！
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={onCreateMenuItem}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs px-4 py-2 rounded-2xl transition shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增第一道餐點</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={isDesktop ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative' : 'space-y-3 relative'}
        >
          {filteredStudioMenuItems.map((item, index) => {
            const globalIndex = orderedItems.findIndex((i) => i.id === item.id);
            const isAtTop = isFiltering ? index === 0 : globalIndex === 0;
            const isAtBottom = isFiltering ? index === filteredStudioMenuItems.length - 1 : globalIndex === orderedItems.length - 1;

            return (
              <AdminMenuItemCard
                key={item.id}
                item={item}
                globalIndex={globalIndex}
                isAtTop={isAtTop}
                isAtBottom={isAtBottom}
                isFiltering={isFiltering}
                isDragging={activeDraggingId === item.id}
                isDragOver={dragOverItemId === item.id && activeDraggingId !== item.id}
                onMoveToTop={handleMoveToTop}
                onMoveStep={handleMoveStep}
                onMoveToBottom={handleMoveToBottom}
                onToggleActive={onToggleMenuItemActive}
                onEdit={onEditMenuItem}
                onDelete={onDeleteMenuItem}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
