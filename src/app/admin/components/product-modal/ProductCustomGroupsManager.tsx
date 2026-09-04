'use client';

import React, { useState } from 'react';
import { CustomGroup } from '@/types/database';
import { Plus, Trash2, X, BookOpen, BookmarkPlus } from 'lucide-react';
import { PresetCustomOptionsDrawer } from './PresetCustomOptionsDrawer';
import { SaveCustomPresetModal } from './SaveCustomPresetModal';

interface ProductCustomGroupsManagerProps {
  productCustomGroups: CustomGroup[];
  setProductCustomGroups: React.Dispatch<React.SetStateAction<CustomGroup[]>>;
  onAddCustomGroup: () => void;
  onRemoveCustomGroup: (groupId: string) => void;
  onAddOptionToGroup: (groupId: string) => void;
  onRemoveOptionFromGroup: (groupId: string, optionId: string) => void;
}

export function ProductCustomGroupsManager({
  productCustomGroups,
  setProductCustomGroups,
  onAddCustomGroup,
  onRemoveCustomGroup,
  onAddOptionToGroup,
  onRemoveOptionFromGroup,
}: ProductCustomGroupsManagerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handleApplyPreset = (groups: CustomGroup[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setProductCustomGroups(groups);
    } else {
      setProductCustomGroups((prev) => [...prev, ...groups]);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          客製化規格選項 (如：甜度、冰塊、加料、熟度)
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 常用範本庫抽屜 */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-200/80 dark:border-sky-800 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
            title="瀏覽並套用經典或自訂規格範本"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📚 常用範本庫</span>
          </button>

          {/* 存為常用範本 (只有在已有規格時可按) */}
          {productCustomGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800 transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
              title="將目前的規格組合儲存為新範本"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>💾 存為常用範本</span>
            </button>
          )}

          {/* 新增群組 */}
          <button
            type="button"
            onClick={onAddCustomGroup}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增群組</span>
          </button>
        </div>
      </div>

      {productCustomGroups.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#182234] border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            尚無客製化規格設定。您可以手動新增群組，或直接從常用範本庫一鍵套用！
          </p>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-500 hover:text-sky-600 dark:text-sky-400 py-1 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900 transition active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>開啟常用範本庫載入</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {productCustomGroups.map((group, groupIdx) => (
            <div
              key={group.id || groupIdx}
              className="bg-slate-50 dark:bg-[#182234] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="群組名稱 (如：甜度)"
                  value={group.title}
                  onChange={(e) => {
                    const newGroups = [...productCustomGroups];
                    newGroups[groupIdx].title = e.target.value;
                    setProductCustomGroups(newGroups);
                  }}
                  className="flex-1 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <select
                  value={group.type}
                  onChange={(e) => {
                    const newGroups = [...productCustomGroups];
                    newGroups[groupIdx].type = e.target.value as 'single' | 'any' | 'limit';
                    setProductCustomGroups(newGroups);
                  }}
                  className="bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-sky-400"
                >
                  <option value="single" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">
                    單選 (必選一項)
                  </option>
                  <option value="any" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">
                    複選 (任選不限)
                  </option>
                  <option value="limit" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">
                    複選 (最多 N 項)
                  </option>
                </select>

                {group.type === 'limit' && (
                  <input
                    type="number"
                    min="1"
                    placeholder="數量"
                    value={group.limit_number || 1}
                    onChange={(e) => {
                      const newGroups = [...productCustomGroups];
                      newGroups[groupIdx].limit_number = parseInt(e.target.value, 10) || 1;
                      setProductCustomGroups(newGroups);
                    }}
                    className="w-14 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                  />
                )}

                <button
                  type="button"
                  onClick={() => onRemoveCustomGroup(group.id)}
                  className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                  title="刪除此客製化群組"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 選項列表 */}
              <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                {group.options.map((opt, optIdx) => (
                  <div key={opt.id || optIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="選項名稱 (如：微糖)"
                      value={opt.name}
                      onChange={(e) => {
                        const newGroups = [...productCustomGroups];
                        newGroups[groupIdx].options[optIdx].name = e.target.value;
                        setProductCustomGroups(newGroups);
                      }}
                      className="flex-1 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 rounded-md px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">+$</span>
                      <input
                        type="number"
                        placeholder="加價"
                        value={opt.price_adjustment}
                        onChange={(e) => {
                          const newGroups = [...productCustomGroups];
                          newGroups[groupIdx].options[optIdx].price_adjustment =
                            parseInt(e.target.value, 10) || 0;
                          setProductCustomGroups(newGroups);
                        }}
                        className="w-14 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-md px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveOptionFromGroup(group.id, opt.id)}
                      className="text-slate-400 hover:text-red-500 p-0.5 transition cursor-pointer"
                      title="刪除此選項"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onAddOptionToGroup(group.id)}
                  className="text-[11px] font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>新增選項</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 常用範本庫抽屜 */}
      <PresetCustomOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApplyPreset={handleApplyPreset}
      />

      {/* 儲存為常用範本彈窗 */}
      <SaveCustomPresetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        groups={productCustomGroups}
      />
    </div>
  );
}
