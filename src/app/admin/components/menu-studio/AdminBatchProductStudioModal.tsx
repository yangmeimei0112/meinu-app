'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ClipboardPaste,
  Grid,
  Zap,
  RotateCw,
} from 'lucide-react';
import type { Store, CustomGroup } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { formatErrorMessage } from '@/lib/errorUtils';
import { cloneGroupsWithFreshIds } from '@/lib/customOptionPresets';
import { BatchStudioWizardGuide } from './batch-studio/BatchStudioWizardGuide';
import { PresetCustomOptionsDrawer } from '../product-modal/PresetCustomOptionsDrawer';

interface AdminBatchProductStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  onBatchSuccess: () => void;
  showToast: (msg: string) => void;
}

interface BatchItemRow {
  id: string;
  name: string;
  price: string;
  description: string;
  is_sold_out: boolean;
  custom_groups: CustomGroup[];
}

function createEmptyRow(): BatchItemRow {
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    price: '',
    description: '',
    is_sold_out: false,
    custom_groups: [],
  };
}

export default function AdminBatchProductStudioModal({
  isOpen,
  onClose,
  store,
  onBatchSuccess,
  showToast,
}: AdminBatchProductStudioModalProps) {
  const [activeMode, setActiveMode] = useState<'grid' | 'text_paste'>('grid');
  const [rows, setRows] = useState<BatchItemRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [textPasteContent, setTextPasteContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 抽屜相關
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTargetRowId, setDrawerTargetRowId] = useState<string | 'batch' | null>(null);

  // 鍵盤焦點控制
  const nameInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
      setSelectedRowIds([]);
      setTextPasteContent('');
      setActiveMode('grid');
    }
  }, [isOpen]);

  // 新增空白列
  const handleAddRow = (focusNew: boolean = false) => {
    const newRow = createEmptyRow();
    setRows((prev) => [...prev, newRow]);
    if (focusNew) {
      setTimeout(() => {
        nameInputRefs.current[newRow.id]?.focus();
      }, 50);
    }
  };

  // 複製列
  const handleDuplicateRow = (row: BatchItemRow) => {
    const dup: BatchItemRow = {
      ...row,
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${row.name} (複製)`,
      custom_groups: cloneGroupsWithFreshIds(row.custom_groups),
    };
    setRows((prev) => [...prev, dup]);
  };

  // 刪除列
  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setSelectedRowIds((prev) => prev.filter((id) => id !== rowId));
  };

  // 批次刪除選取列
  const handleBatchDeleteSelected = () => {
    if (selectedRowIds.length === 0) return;
    setRows((prev) => prev.filter((r) => !selectedRowIds.includes(r.id)));
    setSelectedRowIds([]);
  };

  // 全選/反選
  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === rows.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(rows.map((r) => r.id));
    }
  };

  const handleToggleSelectRow = (rowId: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // 開啟抽屜為單一列或批次選取列套用範本
  const handleOpenPresetDrawerForSingle = (rowId: string) => {
    setDrawerTargetRowId(rowId);
    setIsDrawerOpen(true);
  };

  const handleOpenPresetDrawerForBatch = () => {
    if (selectedRowIds.length === 0) {
      showToast('請先勾選欲套用常用範本的商品項目！');
      return;
    }
    setDrawerTargetRowId('batch');
    setIsDrawerOpen(true);
  };

  // 套用範本回調
  const handleApplyPreset = (groups: CustomGroup[], mode: 'append' | 'replace') => {
    if (drawerTargetRowId === 'batch') {
      // 批次套用給所有選中的列
      setRows((prev) =>
        prev.map((row) => {
          if (selectedRowIds.includes(row.id)) {
            const fresh = cloneGroupsWithFreshIds(groups);
            return {
              ...row,
              custom_groups: mode === 'replace' ? fresh : [...row.custom_groups, ...fresh],
            };
          }
          return row;
        })
      );
      showToast(`已成功為 ${selectedRowIds.length} 項商品套用規格範本！`);
    } else if (drawerTargetRowId) {
      // 套用給單一列
      setRows((prev) =>
        prev.map((row) => {
          if (row.id === drawerTargetRowId) {
            const fresh = cloneGroupsWithFreshIds(groups);
            return {
              ...row,
              custom_groups: mode === 'replace' ? fresh : [...row.custom_groups, ...fresh],
            };
          }
          return row;
        })
      );
    }
    setDrawerTargetRowId(null);
  };

  // 智慧文字解析處理
  const handleParseTextPaste = () => {
    const text = textPasteContent.trim();
    if (!text) {
      showToast('請輸入或貼上欲解析的菜單文字！');
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsedRows: BatchItemRow[] = [];

    for (const line of lines) {
      const cleanLine = line.trim();
      // 匹配品名、價格、說明 (支援 Tab、空格、錢字符號)
      // 例如: "珍珠奶茶 50 招牌飲料" 或 "珍珠奶茶\t50\t說明" 或 "排骨飯 $100"
      const match = cleanLine.match(/^([^\d$]+)[\s\t$]+(\d+)(?:[\s\t]+(.*))?$/);

      if (match) {
        const name = match[1].trim();
        const price = match[2].trim();
        const description = (match[3] || '').trim();
        parsedRows.push({
          id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          price,
          description,
          is_sold_out: false,
          custom_groups: [],
        });
      } else {
        // 若無法完全匹配，將全部視為品名
        parsedRows.push({
          id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: cleanLine,
          price: '',
          description: '',
          is_sold_out: false,
          custom_groups: [],
        });
      }
    }

    if (parsedRows.length > 0) {
      setRows(parsedRows);
      setActiveMode('grid');
      showToast(`✨ 成功智慧解析 ${parsedRows.length} 道餐點，已轉入網格！`);
    }
  };

  // 計算有效商品
  const validRows = useMemo(() => {
    return rows.filter((r) => r.name.trim().length > 0 && r.price.trim().length > 0 && Number(r.price) >= 0);
  }, [rows]);

  // 提交批次上架至 Supabase
  const handleSubmitBatch = async () => {
    if (validRows.length === 0) {
      showToast('請至少填寫 1 項包含「餐點名稱」與「價格」的有效商品！');
      return;
    }

    setIsSubmitting(true);

    try {
      // 組合 insert payloads
      const payloads = validRows.map((row) => ({
        store_id: store.id,
        name: row.name.trim(),
        price: Number(row.price),
        description: row.description.trim() || null,
        is_sold_out: row.is_sold_out,
        custom_groups: row.custom_groups.length > 0 ? row.custom_groups : null,
      }));

      const { error: insertError } = await supabase.from('menu_items').insert(payloads);

      if (insertError) throw insertError;

      showToast(`🎉 成功批量上架 ${validRows.length} 項餐點品項！`);
      onBatchSuccess();
      onClose();
    } catch (err: any) {
      console.error('批量上架失敗:', err);
      showToast(formatErrorMessage(err, '批量上架失敗，請檢查網路連線或資料格式'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#111927] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* 頂部標題與模式切換列 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                  極速多商品批量上架工作台
                </h3>
                <span className="text-xs bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-black px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  {store.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold">
                支援鍵盤極速快打、剪貼簿智慧文字解析與多品項批次套用常用客製規格
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* 模式切換按鈕 */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveMode('grid')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'grid'
                    ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>試算表快打</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('text_paste')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'text_paste'
                    ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>貼上文字解析</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🧙‍♂️ 引導小精靈區域 (可開關/收合) */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#141d2e]">
          <BatchStudioWizardGuide />
        </div>

        {/* 主內容區塊 */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-4">
          {/* 模式 1: 試算表快打網格 */}
          {activeMode === 'grid' && (
            <div className="space-y-3">
              {/* 網格頂部批次操作列 */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-[#162032] p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    {selectedRowIds.length === rows.length && rows.length > 0
                      ? '取消全選'
                      : `全選 (${selectedRowIds.length}/${rows.length})`}
                  </button>

                  {/* 批量套用範本按鈕 */}
                  <button
                    type="button"
                    onClick={handleOpenPresetDrawerForBatch}
                    disabled={selectedRowIds.length === 0}
                    className="px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 disabled:opacity-40 transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>📚 批量套用常用客製範本 ({selectedRowIds.length})</span>
                  </button>

                  {/* 批次刪除選取 */}
                  {selectedRowIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchDeleteSelected}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>刪除選取 ({selectedRowIds.length})</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddRow(true)}
                    className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增一列</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('確定要清空所有編輯中的商品列嗎？')) {
                        setRows([createEmptyRow()]);
                        setSelectedRowIds([]);
                      }
                    }}
                    className="px-2 py-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    清空
                  </button>
                </div>
              </div>

              {/* 網格表格 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 dark:bg-[#152033] text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRowIds.length === rows.length && rows.length > 0}
                            onChange={handleToggleSelectAll}
                            className="rounded accent-sky-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-2.5 w-12 text-center text-slate-400">#</th>
                        <th className="p-2.5 min-w-[160px]">餐點名稱 *</th>
                        <th className="p-2.5 w-24">基本價格 ($) *</th>
                        <th className="p-2.5 min-w-[180px]">餐點簡介描述</th>
                        <th className="p-2.5 min-w-[160px]">客製化規格選項</th>
                        <th className="p-2.5 w-20 text-center">狀態</th>
                        <th className="p-2.5 w-20 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111927]">
                      {rows.map((row, idx) => {
                        const isSelected = selectedRowIds.includes(row.id);
                        const hasCustom = row.custom_groups.length > 0;
                        const totalOptions = row.custom_groups.reduce(
                          (acc, g) => acc + (g.options?.length || 0),
                          0
                        );

                        return (
                          <tr
                            key={row.id}
                            className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                              isSelected ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''
                            }`}
                          >
                            {/* 勾選方塊 */}
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(row.id)}
                                className="rounded accent-sky-500 cursor-pointer"
                              />
                            </td>

                            {/* 序號 */}
                            <td className="p-2.5 text-center text-slate-400 font-mono font-bold">
                              {idx + 1}
                            </td>

                            {/* 餐點名稱 */}
                            <td className="p-2">
                              <input
                                ref={(el) => {
                                  nameInputRefs.current[row.id] = el;
                                }}
                                type="text"
                                placeholder="例如：珍珠奶茶"
                                value={row.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) =>
                                    prev.map((r) => (r.id === row.id ? { ...r, name: val } : r))
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // 若在最後一行按 Enter，自動新增一行並聚焦
                                    if (idx === rows.length - 1) {
                                      handleAddRow(true);
                                    } else {
                                      // 聚焦下一行的名稱
                                      nameInputRefs.current[rows[idx + 1].id]?.focus();
                                    }
                                  }
                                }}
                                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
                              />
                            </td>

                            {/* 基本價格 */}
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                placeholder="50"
                                value={row.price}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) =>
                                    prev.map((r) => (r.id === row.id ? { ...r, price: val } : r))
                                  );
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (idx === rows.length - 1) {
                                      handleAddRow(true);
                                    } else {
                                      nameInputRefs.current[rows[idx + 1].id]?.focus();
                                    }
                                  }
                                }}
                                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
                              />
                            </td>

                            {/* 餐點簡介描述 */}
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="選填介紹或特色..."
                                value={row.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRows((prev) =>
                                    prev.map((r) => (r.id === row.id ? { ...r, description: val } : r))
                                  );
                                }}
                                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
                              />
                            </td>

                            {/* 客製規格 */}
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() => handleOpenPresetDrawerForSingle(row.id)}
                                className={`w-full py-1.5 px-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                  hasCustom
                                    ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                                    : 'bg-slate-50 dark:bg-[#182234] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                                }`}
                                title="點擊設定或從範本庫載入規格"
                              >
                                <span className="truncate">
                                  {hasCustom
                                    ? `${row.custom_groups.map((g) => g.title || '規格').join('+')} (${totalOptions}項)`
                                    : '+ 常用規格...'}
                                </span>
                                <BookOpen className="w-3.5 h-3.5 shrink-0 ml-1 opacity-70" />
                              </button>
                            </td>

                            {/* 上下架狀態 */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id ? { ...r, is_sold_out: !r.is_sold_out } : r
                                    )
                                  );
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                  row.is_sold_out
                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {row.is_sold_out ? '下架' : '上架'}
                              </button>
                            </td>

                            {/* 操作 */}
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRow(row)}
                                  className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                  title="複製此列"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(row.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                  title="刪除此列"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 快捷新增按鈕與鍵盤提示 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => handleAddRow(true)}
                  className="inline-flex items-center gap-1 text-sky-500 hover:text-sky-600 font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>點擊此處或按 Enter 繼續新增下一列</span>
                </button>
                <div className="flex items-center gap-2 text-[11px]">
                  <span>💡 鍵盤快速操作：按 <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Tab</kbd> 切換欄位 &bull; 按 <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold">Enter</kbd> 換行新增</span>
                </div>
              </div>
            </div>
          )}

          {/* 模式 2: 剪貼簿文字貼上解析 */}
          {activeMode === 'text_paste' && (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-[#162032] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <ClipboardPaste className="w-4 h-4 text-sky-500" />
                    <span>貼上菜單文字（每行一道菜，支援品名、價格與描述）</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTextPasteContent(
                        '珍珠奶茶 50 招牌黑糖手工珍珠\n四季春青茶 35 嚴選高山茶葉\n經典紅茶拿鐵 60 濃純鮮奶調配\n百香雙Q果 55 珍珠加椰果雙重享受\n檸檬冬瓜茶 45 屏東新鮮檸檬原汁'
                      );
                    }}
                    className="text-[11px] font-bold text-sky-500 hover:text-sky-600 cursor-pointer"
                  >
                    載入範例文本
                  </button>
                </div>

                <textarea
                  rows={8}
                  placeholder={`請直接貼上整段菜單文字，例如：\n珍珠奶茶 50 招牌黑糖手工珍珠\n四季春青茶 35\n排骨便當 100 附三樣配菜與熱湯\n紅茶拿鐵 $60`}
                  value={textPasteContent}
                  onChange={(e) => setTextPasteContent(e.target.value)}
                  className="w-full bg-white dark:bg-[#101725] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-2xl p-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400">
                    支援以空格、Tab 鍵、逗號或錢字號 ($) 分隔品名與價格，系統將自動精準拆解！
                  </p>
                  <button
                    type="button"
                    onClick={handleParseTextPaste}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>立即智慧解析並載入至網格</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部總結與批量上架確認列 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#141d2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400">
              共編輯 <strong className="text-slate-800 dark:text-slate-100">{rows.length}</strong> 列
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>有效商品：{validRows.length} 項</span>
            </span>
            {rows.length > validRows.length && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>尚有 {rows.length - validRows.length} 列未填寫完整品名或價格 (上架時將自動略過)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-2xl text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              取消返回
            </button>
            <button
              type="button"
              disabled={validRows.length === 0 || isSubmitting}
              onClick={handleSubmitBatch}
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-50 text-white font-black py-2.5 px-6 rounded-2xl text-xs shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>批次寫入菜單庫中...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>🚀 一鍵批量上架 ({validRows.length} 項餐點)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 常用範本庫抽屜 */}
      <PresetCustomOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerTargetRowId(null);
        }}
        onApplyPreset={handleApplyPreset}
      />
    </div>
  );
}
