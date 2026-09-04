'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  BookOpen,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  Tag,
  Layers,
} from 'lucide-react';
import { CustomGroup } from '@/types/database';
import {
  CustomOptionPreset,
  getAllCustomOptionPresets,
  deleteCustomOptionPreset,
  renameCustomOptionPreset,
  cloneGroupsWithFreshIds,
} from '@/lib/customOptionPresets';

interface PresetCustomOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (groups: CustomGroup[], mode: 'append' | 'replace') => void;
}

export function PresetCustomOptionsDrawer({
  isOpen,
  onClose,
  onApplyPreset,
}: PresetCustomOptionsDrawerProps) {
  const [presets, setPresets] = useState<CustomOptionPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'beverage' | 'food' | 'custom'>('all');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');

  const loadPresets = () => {
    setPresets(getAllCustomOptionPresets());
  };

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      setSearchQuery('');
      setEditingPresetId(null);
    }
  }, [isOpen]);

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return presets.filter((preset) => {
      // 類別過濾
      if (filterCategory === 'custom' && preset.isBuiltIn) return false;
      if (filterCategory === 'beverage' && preset.category !== 'beverage') return false;
      if (filterCategory === 'food' && preset.category !== 'food') return false;

      if (!q) return true;

      // 關鍵字搜尋：範本名、描述、群組標題、選項名
      const matchName = preset.name.toLowerCase().includes(q);
      const matchDesc = (preset.description || '').toLowerCase().includes(q);
      const matchGroups = preset.groups.some(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.options.some((o) => o.name.toLowerCase().includes(q))
      );

      return matchName || matchDesc || matchGroups;
    });
  }, [presets, searchQuery, filterCategory]);

  const handleApply = (preset: CustomOptionPreset, mode: 'append' | 'replace') => {
    const freshGroups = cloneGroupsWithFreshIds(preset.groups);
    onApplyPreset(freshGroups, mode);
    onClose();
  };

  const handleDelete = (presetId: string, name: string) => {
    if (confirm(`確定要從常用庫中刪除自訂範本「${name}」嗎？`)) {
      deleteCustomOptionPreset(presetId);
      loadPresets();
    }
  };

  const handleStartRename = (preset: CustomOptionPreset) => {
    setEditingPresetId(preset.id);
    setEditNameInput(preset.name);
  };

  const handleSaveRename = (presetId: string) => {
    if (editNameInput.trim()) {
      renameCustomOptionPreset(presetId, editNameInput.trim());
      loadPresets();
    }
    setEditingPresetId(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* 頂部標題列 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>常用客製化選項庫</span>
                <span className="text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                  {presets.length} 個範本
                </span>
              </h3>
              <p className="text-xs text-slate-400">一鍵套用經典手搖甜度冰塊、加料、辣度熟度或自訂規格</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜尋與類別標籤 */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-[#151f32]">
          {/* 搜尋欄 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋範本名稱、選項關鍵字 (如：珍珠、微糖、熟度)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 類別篩選膠囊 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-xl transition cursor-pointer shrink-0 ${
                filterCategory === 'all'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              全部範本
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('beverage')}
              className={`px-3 py-1 rounded-xl transition cursor-pointer shrink-0 ${
                filterCategory === 'beverage'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              🥤 飲品茶類
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('food')}
              className={`px-3 py-1 rounded-xl transition cursor-pointer shrink-0 ${
                filterCategory === 'food'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              🍱 餐點熱食
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('custom')}
              className={`px-3 py-1 rounded-xl transition cursor-pointer shrink-0 ${
                filterCategory === 'custom'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              👤 我的自訂庫
            </button>
          </div>
        </div>

        {/* 範本卡片清單 */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredPresets.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400 font-bold">未找到符合條件的客製範本</p>
              <p className="text-[11px] text-slate-400">您可以在單品編輯頁面點擊「💾 存為常用範本」新增專屬規格庫</p>
            </div>
          ) : (
            filteredPresets.map((preset) => {
              const isEditingThis = editingPresetId === preset.id;
              const totalOptionsCount = preset.groups.reduce(
                (acc, g) => acc + (g.options?.length || 0),
                0
              );

              return (
                <div
                  key={preset.id}
                  className="bg-slate-50 dark:bg-[#182234] rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 space-y-3 hover:border-sky-300 dark:hover:border-sky-800 transition"
                >
                  {/* 範本頂部：標題與操作 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="bg-white dark:bg-[#0E1726] border border-sky-400 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(preset.id);
                              if (e.key === 'Escape') setEditingPresetId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(preset.id)}
                            className="p-1 rounded-lg bg-sky-500 text-white hover:bg-sky-600 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPresetId(null)}
                            className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 hover:bg-slate-300 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{preset.name}</span>
                          </h4>
                          {preset.isBuiltIn ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>系統經典</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                              <Tag className="w-2.5 h-2.5" />
                              <span>自訂範本</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                            <Layers className="w-3 h-3" />
                            <span>{preset.groups.length} 組規格 &bull; 共 {totalOptionsCount} 項</span>
                          </span>
                        </div>
                      )}

                      {preset.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {preset.description}
                        </p>
                      )}
                    </div>

                    {/* 自訂範本的更名與刪除按鈕 */}
                    {!preset.isBuiltIn && !isEditingThis && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartRename(preset)}
                          className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="重新命名範本"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(preset.id, preset.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="刪除自訂範本"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 規格細節清單展示 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {preset.groups.map((group, idx) => (
                      <div
                        key={group.id || idx}
                        className="bg-white dark:bg-[#131B2B] p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {group.title || `規格組 ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                            {group.type === 'single'
                              ? '單選'
                              : group.type === 'any'
                              ? '複選 (不限)'
                              : `最多 ${group.limit_number} 項`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.options.map((opt, oIdx) => (
                            <span
                              key={opt.id || oIdx}
                              className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                            >
                              <span>{opt.name}</span>
                              {opt.price_adjustment > 0 && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                  +${opt.price_adjustment}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 套用按鈕區 */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => handleApply(preset, 'append')}
                      className="bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-sky-600 dark:text-sky-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800/80 transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>➕ 追加至現有規格</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApply(preset, 'replace')}
                      className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>🔄 覆蓋現有規格</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部關閉按鈕 */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#131B2B]">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            關閉範本庫
          </button>
        </div>
      </div>
    </div>
  );
}
