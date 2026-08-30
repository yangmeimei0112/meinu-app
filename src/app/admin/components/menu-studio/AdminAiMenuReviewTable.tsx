'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';

export interface RecognizedItem {
  tempId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  is_sold_out: boolean;
  custom_groups: {
    id: string;
    title: string;
    type: 'single' | 'multiple';
    options: { id: string; name: string; price: number; is_default?: boolean }[];
  }[];
  selected: boolean;
}

interface AdminAiMenuReviewTableProps {
  storeId: string;
  storeName: string;
  initialItems: RecognizedItem[];
  onImportSuccess: (importedCount: number) => void;
  onCancel: () => void;
}

export function AdminAiMenuReviewTable({
  storeId,
  storeName,
  initialItems,
  onImportSuccess,
  onCancel,
}: AdminAiMenuReviewTableProps) {
  const [items, setItems] = useState<RecognizedItem[]>(initialItems);
  const [filterText, setFilterText] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCount = items.filter((i) => i.selected).length;

  // 切換單一品項選取
  const handleToggleSelect = (tempId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, selected: !item.selected } : item))
    );
  };

  // 全選 / 全不選
  const handleToggleSelectAll = () => {
    const nextState = selectedCount < items.length;
    setItems((prev) => prev.map((item) => ({ ...item, selected: nextState })));
  };

  // 修改品項基本資料
  const handleUpdateItem = (
    tempId: string,
    field: keyof RecognizedItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item))
    );
  };

  // 刪除品項
  const handleDeleteItem = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // 手動新增一筆品項
  const handleAddNewItem = () => {
    const newItem: RecognizedItem = {
      tempId: `manual_${Date.now()}`,
      name: '新餐點品項',
      price: 50,
      description: '',
      category: '自訂品項',
      is_sold_out: false,
      custom_groups: [],
      selected: true,
    };
    setItems((prev) => [newItem, ...prev]);
  };

  // 執行批次寫入 Supabase
  const handleExecuteImport = async () => {
    const targetItems = items.filter((i) => i.selected);
    if (targetItems.length === 0) {
      setErrorMessage('請至少選取一個欲匯入的餐點品項！');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      // 查詢當前店家最大的 sort_order
      let baseSortOrder = 0;
      const { data: currentList } = await supabase
        .from('menu_items')
        .select('sort_order')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: false })
        .limit(1);

      if (currentList && currentList.length > 0 && typeof currentList[0].sort_order === 'number') {
        baseSortOrder = currentList[0].sort_order + 1;
      }

      // 組裝寫入 payload
      const rowsToInsert = targetItems.map((item, index) => ({
        store_id: storeId,
        name: item.name.trim(),
        price: Number(item.price) || 0,
        description: item.description?.trim() || null,
        is_sold_out: Boolean(item.is_sold_out),
        custom_groups: item.custom_groups || [],
        sort_order: baseSortOrder + index,
      }));

      const { error } = await supabase.from('menu_items').insert(rowsToInsert).select();

      if (error) {
        throw new Error(error.message || '寫入資料庫失敗');
      }

      onImportSuccess(rowsToInsert.length);
    } catch (e: any) {
      console.error('批次匯入錯誤:', e);
      setErrorMessage(e.message || '匯入時發生未知錯誤，請檢查網路連線後重試');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter((item) =>
    filterText ? item.name.toLowerCase().includes(filterText.toLowerCase()) || item.category?.toLowerCase().includes(filterText.toLowerCase()) : true
  );

  return (
    <div className="space-y-4">
      {/* 頂部摘要與批次控制列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/70 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              AI 視覺辨識完成！共識別出 {items.length} 道餐點
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            請核對餐點名稱、價格與客製化規格，確認無誤後即可一鍵匯入【{storeName}】
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {selectedCount === items.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-sky-500" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{selectedCount === items.length ? '全部取消' : '全選品項'}</span>
          </button>

          <button
            type="button"
            onClick={handleAddNewItem}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增品項</span>
          </button>
        </div>
      </div>

      {/* 搜尋過濾 */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="搜尋已辨識之餐點名稱或分類..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 品項核對清單 */}
      <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
        {filteredItems.map((item) => {
          const isExpanded = expandedItemId === item.tempId;
          const hasCustomGroups = item.custom_groups && item.custom_groups.length > 0;

          return (
            <div
              key={item.tempId}
              className={`p-3.5 rounded-2xl border transition-all ${
                item.selected
                  ? 'bg-white dark:bg-[#131B2B] border-sky-200 dark:border-sky-800/60 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 選取核取方塊 */}
                <button
                  type="button"
                  onClick={() => handleToggleSelect(item.tempId)}
                  className="shrink-0 p-1 text-sky-500 hover:text-sky-600 transition cursor-pointer"
                >
                  {item.selected ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* 品項名稱輸入框 */}
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.tempId, 'name', e.target.value)}
                    placeholder="餐點名稱"
                    className="w-full text-xs font-extrabold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none py-1"
                  />
                </div>

                {/* 單價輸入框 */}
                <div className="w-24 shrink-0 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    onChange={(e) => handleUpdateItem(item.tempId, 'price', Number(e.target.value))}
                    className="w-full text-xs font-mono font-black text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                  />
                </div>

                {/* 規格展開按鈕 */}
                {hasCustomGroups && (
                  <button
                    type="button"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.tempId)}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800/60 transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Layers className="w-3 h-3" />
                    <span>{item.custom_groups.length} 組規格</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}

                {/* 刪除按鈕 */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.tempId)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg cursor-pointer"
                  title="移除此品項"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 規格群組展開細節 */}
              {isExpanded && hasCustomGroups && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/60 dark:bg-slate-900/60 p-2.5 rounded-xl animate-in slide-in-from-top-2 duration-150">
                  <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                    已自動綁定之客製化規格選項：
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.custom_groups.map((cg) => (
                      <div
                        key={cg.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-[10px] text-slate-700 dark:text-slate-200"
                      >
                        <span className="font-extrabold text-sky-600 dark:text-sky-400">
                          {cg.title} ({cg.type === 'single' ? '單選' : '複選'})：
                        </span>{' '}
                        <span>
                          {cg.options.map((o) => `${o.name}${o.price > 0 ? `(+$${o.price})` : ''}`).join('、')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部確認與寫入按鈕 */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 px-4 py-2 rounded-xl transition cursor-pointer"
        >
          放棄並重新拍攝
        </button>

        <button
          type="button"
          onClick={handleExecuteImport}
          disabled={isSaving || selectedCount === 0}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在批量寫入資料庫...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>確認匯入選取的 {selectedCount} 道餐點</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
