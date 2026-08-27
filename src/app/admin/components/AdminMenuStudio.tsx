'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Category, MenuItem, Store } from '@/types/database';
import { useDebounce } from '@/lib/useDebounce';
import {
  ChevronLeft,
  Store as StoreIcon,
  Pencil,
  Download,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Sparkles,
  UtensilsCrossed,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
  RotateCw,
  Search,
} from 'lucide-react';

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

  // 🧹 組件卸載時清除尚未執行的定時器
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

  // ----------------------------------------------------
  // 🔍 搜尋與篩選邏輯
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 🎯 智慧單階微調 (▲ / ▼) 與 置頂 / 置底 (🔝 / ⬇️)
  // ----------------------------------------------------
  // 1. 單步上下移動（支援篩選狀態下的智慧交換）
  const handleMoveStep = useCallback(
    (itemId: string, direction: 'up' | 'down') => {
      if (isFiltering) {
        // 篩選模式下：尋找目前在可見清單中的相鄰品項並進行交換
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
        // 全量模式下：直接進行相鄰交換
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

  // 2. 一鍵置頂（移至最前 #1）
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

  // 3. 一鍵置底（移至最後）
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

  // ----------------------------------------------------
  // 🖐️ 手機觸控長按 (Touch Long-Press) ＋ 電腦端卡片拖曳排序
  // ----------------------------------------------------
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchDraggingRef = useRef<boolean>(false);
  const touchCurrentTargetIdRef = useRef<string | null>(null);
  const touchSourceIdRef = useRef<string | null>(null);

  // 核心陣列重排呼叫
  const executeReorder = useCallback(
    (sourceId: string, targetId: string) => {
      const fromIdx = orderedItems.findIndex((i) => i.id === sourceId);
      const toIdx = orderedItems.findIndex((i) => i.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      const newItems = [...orderedItems];
      const [moved] = newItems.splice(fromIdx, 1);
      newItems.splice(toIdx, 0, moved);
      commitReorder(newItems);
    },
    [orderedItems, commitReorder]
  );

  // 電腦端 HTML5 卡片任一處拖曳
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isFiltering) return;
    const target = e.target as HTMLElement;
    // 點擊按鈕、連結或輸入框時不觸發卡片拖曳
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    if (isFiltering) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemId !== targetId) {
      setDragOverItemId(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (isFiltering) return;
    e.preventDefault();
    const sourceId = activeDraggingId || e.dataTransfer.getData('text/plain');
    setActiveDraggingId(null);
    setDragOverItemId(null);

    if (!sourceId || sourceId === targetId) return;
    executeReorder(sourceId, targetId);
  };

  const handleDragEnd = () => {
    setActiveDraggingId(null);
    setDragOverItemId(null);
  };

  // 手機端 Touch 長按 (Long-press) 拖曳處理
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (isFiltering) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
      return;
    }

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isTouchDraggingRef.current = false;
    touchSourceIdRef.current = id;

    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }

    // 長按 180ms 即可啟動卡片拖曳模態
    touchTimerRef.current = setTimeout(() => {
      isTouchDraggingRef.current = true;
      setActiveDraggingId(id);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {}
      }
    }, 180);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    if (!isTouchDraggingRef.current) {
      // 若尚未觸發長按前手指移動超過 8px，視為使用者正在一般上下滑動瀏覽，取消長按
      if (dx > 8 || dy > 8) {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
      }
      return;
    }

    // 已進入長按拖曳：阻止預設瀏覽器滾動
    if (e.cancelable) {
      e.preventDefault();
    }

    // 透過觸控座標偵測手指正下方的卡片
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = el?.closest('[data-item-card-id]') as HTMLElement | null;
    const hoverId = cardEl?.getAttribute('data-item-card-id');

    if (hoverId && hoverId !== touchSourceIdRef.current) {
      touchCurrentTargetIdRef.current = hoverId;
      setDragOverItemId(hoverId);
    } else {
      touchCurrentTargetIdRef.current = null;
      setDragOverItemId(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    if (isTouchDraggingRef.current && touchSourceIdRef.current && touchCurrentTargetIdRef.current) {
      const sourceId = touchSourceIdRef.current;
      const targetId = touchCurrentTargetIdRef.current;
      if (sourceId !== targetId) {
        executeReorder(sourceId, targetId);
      }
    }

    isTouchDraggingRef.current = false;
    touchStartPosRef.current = null;
    touchSourceIdRef.current = null;
    touchCurrentTargetIdRef.current = null;
    setActiveDraggingId(null);
    setDragOverItemId(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-150 relative select-none">
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
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>返回店家列表</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/60 dark:to-indigo-950/60 border border-sky-100 dark:border-sky-900/60 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {activeStudioStore.image_url ? (
                  <img
                    src={activeStudioStore.image_url}
                    alt={activeStudioStore.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <StoreIcon className="w-7 h-7 text-sky-400 stroke-[1.8]" />
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>{activeStudioStore.name}</span>
                  <span className="text-xs bg-slate-900 text-white dark:bg-sky-500 font-mono font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    {activeStudioStore.code || 'S-001'}
                  </span>
                  <span className="text-xs bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
                    {categoryName}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  專屬菜單設計工作室 &bull; 共 {orderedItems.length} 道餐點 ({activeItemCount} 道上架中)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pl-2 sm:pl-0">
            <button
              type="button"
              onClick={() => onEditStore(activeStudioStore)}
              className="bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>店家資料</span>
            </button>

            {onOpenBatchImportModal && (
              <button
                type="button"
                onClick={onOpenBatchImportModal}
                className="bg-white/90 dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-black px-3.5 py-2 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 transition active:scale-95 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯入 CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCreateMenuItem}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-black px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增餐點品項</span>
            </button>
          </div>
        </div>

        {/* 搜尋、篩選與即時儲存狀態指示 */}
        <div className="space-y-3 pl-2">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* 搜尋框 */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="搜尋餐點名稱或說明內容..."
                className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white/90 dark:bg-[#0E1726]/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition shadow-2xs"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 上架狀態篩選 */}
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
                全部 ({orderedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setItemStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  itemStatusFilter === 'active'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>上架中 ({activeItemCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setItemStatusFilter('sold_out')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                  itemStatusFilter === 'sold_out'
                    ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Circle className="w-3 h-3" />
                <span>已下架 ({soldOutItemCount})</span>
              </button>
            </div>

            {/* 🌟 即時自動儲存狀態徽章 */}
            <div className="flex items-center gap-2 shrink-0">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 text-[11px] font-bold shadow-2xs">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>儲存排序中...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-bold shadow-2xs animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>排序已即時自動儲存 ✓</span>
                </span>
              )}
              {saveStatus === 'idle' && (
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                  title="手動確認儲存當前排序"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>排序就緒</span>
                </button>
              )}
            </div>
          </div>

          {/* 智慧功能提示 */}
          <div className="flex items-center gap-2 text-[11px] text-sky-700 dark:text-sky-300 font-bold bg-sky-50/90 dark:bg-sky-950/60 p-2.5 rounded-2xl border border-sky-100 dark:border-sky-900/50">
            <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              {isFiltering
                ? `🔍 目前正在篩選餐點（顯示 ${filteredStudioMenuItems.length} / 共 ${orderedItems.length} 項），點擊箭頭按鈕將智慧相鄰挪動；清空篩選後即可長按或拖曳全店排序！`
                : '智慧排序：長按餐點模塊任一處（或電腦滑鼠按住拖曳）即可自由上下挪動順序！周圍品項將即時讓位。亦可使用卡片上的「置頂 (🔝)」、「上移 (▲)」、「下移 (▼)」、「置底 (⬇️)」按鈕快速調序！'}
            </span>
          </div>
        </div>
      </div>

      {/* 菜單品項清單 */}
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
            // 計算在全域 orderedItems 中的真實索引
            const globalIndex = orderedItems.findIndex((i) => i.id === item.id);
            const isAtTop = isFiltering ? index === 0 : globalIndex === 0;
            const isAtBottom = isFiltering ? index === filteredStudioMenuItems.length - 1 : globalIndex === orderedItems.length - 1;
            const isDragging = activeDraggingId === item.id;
            const isDragOver = dragOverItemId === item.id && !isDragging;

            return (
              <div
                key={item.id}
                data-id={item.id}
                data-item-card-id={item.id}
                draggable={!isFiltering}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
                onTouchStart={(e) => handleTouchStart(e, item.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className={`rounded-3xl p-5 border space-y-3.5 flex flex-col justify-between backdrop-blur-md select-none transition-all duration-200 ${
                  !isFiltering ? 'cursor-grab active:cursor-grabbing' : ''
                } ${
                  isDragging
                    ? 'opacity-40 scale-95 border-dashed border-sky-400 bg-sky-50/50 dark:bg-sky-950/40 shadow-2xl ring-2 ring-sky-400 z-30'
                    : isDragOver
                    ? 'ring-2 ring-sky-500 border-sky-500 shadow-lg scale-[1.02] bg-sky-50/60 dark:bg-sky-950/50 z-20'
                    : !item.is_sold_out
                    ? 'bg-white/95 dark:bg-[#0E1726]/95 border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md'
                    : 'bg-slate-50/70 dark:bg-[#121622]/70 opacity-80 border-dashed border-slate-300 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2.5">
                  {/* 頂部：序號標註 (#1, #2...) ＋ 拖曳把手 ＋ 快速調序控制 ＋ 售罄切換 */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 醒目序號標章 (展示目前排定順位) */}
                      <span
                        className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 shadow-2xs shrink-0"
                        title={`全店第 ${globalIndex + 1} 順位`}
                      >
                        #{globalIndex + 1}
                      </span>

                      {/* 專屬純向量拖曳提示手把 */}
                      {!isFiltering && (
                        <span
                          className="text-slate-400 p-1 rounded-lg pointer-events-none"
                          title="長按整張卡片或按住拖曳挪動順序"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                      )}

                      {/* 🚀 快速調序控制群組：置頂 ＋ 上移 ＋ 下移 ＋ 置底 */}
                      <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
                        {/* 一鍵置頂 */}
                        <button
                          type="button"
                          disabled={isAtTop}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToTop(item.id);
                          }}
                          className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                          title="移至最前 (一鍵置頂)"
                          aria-label="移至最前"
                        >
                          <ArrowUpToLine className="w-3 h-3" />
                        </button>

                        {/* 上移一位 */}
                        <button
                          type="button"
                          disabled={isAtTop}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveStep(item.id, 'up');
                          }}
                          className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                          title="向上挪一位"
                          aria-label="向上挪一位"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>

                        {/* 下移一位 */}
                        <button
                          type="button"
                          disabled={isAtBottom}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveStep(item.id, 'down');
                          }}
                          className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                          title="向下挪一位"
                          aria-label="向下挪一位"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {/* 一鍵置底 */}
                        <button
                          type="button"
                          disabled={isAtBottom}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToBottom(item.id);
                          }}
                          className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                          title="移至最後 (一鍵置底)"
                          aria-label="移至最後"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 上下架狀態切換 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMenuItemActive(item.id);
                      }}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1 ${
                        !item.is_sold_out
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/80'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {!item.is_sold_out ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>上架中</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3 h-3 text-slate-400" />
                          <span>已下架</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 餐點名稱與價格 */}
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-base truncate">{item.name}</h4>
                    <p className="text-sky-600 dark:text-sky-400 font-black text-base mt-0.5 font-mono">
                      ${item.price}{' '}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">元</span>
                    </p>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditMenuItem(item);
                    }}
                    className="flex-1 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-black py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 border border-sky-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>編輯餐點與規格</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMenuItem(item.id);
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                    title="刪除餐點"
                    aria-label="刪除餐點"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
