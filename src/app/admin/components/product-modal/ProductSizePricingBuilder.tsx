'use client';

import React from 'react';
import { CustomGroup } from '@/types/database';
import { Plus, Trash2, Tag } from 'lucide-react';

interface ProductSizePricingBuilderProps {
  basePrice: number;
  setBasePrice: (price: string) => void;
  productCustomGroups: CustomGroup[];
  setProductCustomGroups: React.Dispatch<React.SetStateAction<CustomGroup[]>>;
}

const SIZE_GROUP_TITLES = ['容量尺寸', '杯型尺寸', '尺寸', '份量大小', '份量'];

export function isSizeCustomGroup(group: CustomGroup): boolean {
  return SIZE_GROUP_TITLES.includes(group.title.trim());
}

export function ProductSizePricingBuilder({
  basePrice,
  setBasePrice,
  productCustomGroups,
  setProductCustomGroups,
}: ProductSizePricingBuilderProps) {
  const sizeGroupIndex = productCustomGroups.findIndex((g) => isSizeCustomGroup(g));
  const sizeGroup = sizeGroupIndex !== -1 ? productCustomGroups[sizeGroupIndex] : null;
  const isEnabled = !!sizeGroup;

  // 1. 開啟「中杯 / 大杯多尺寸定價」
  const handleEnableSizePricing = () => {
    const timestamp = Date.now();
    const newGroup: CustomGroup = {
      id: `grp-size-${timestamp}`,
      title: '容量尺寸',
      type: 'single',
      options: [
        { id: `opt-size-m-${timestamp}`, name: '中杯 (M)', price_adjustment: 0 },
        { id: `opt-size-l-${timestamp}`, name: '大杯 (L)', price_adjustment: 10 },
      ],
    };

    setProductCustomGroups((prev) => [newGroup, ...prev.filter((g) => !isSizeCustomGroup(g))]);
  };

  // 2. 停用「多尺寸定價」
  const handleDisableSizePricing = () => {
    setProductCustomGroups((prev) => prev.filter((g) => !isSizeCustomGroup(g)));
  };

  // 3. 修改某尺寸名稱
  const handleUpdateOptionName = (optionId: string, newName: string) => {
    if (!sizeGroup) return;
    const updatedOptions = sizeGroup.options.map((opt) =>
      opt.id === optionId ? { ...opt, name: newName } : opt
    );
    updateSizeGroupOptions(updatedOptions);
  };

  // 4. 修改某尺寸個別售價（自動換算差價）
  const handleUpdateOptionPrice = (optionId: string, inputFinalPrice: string) => {
    if (!sizeGroup) return;
    const numericFinalPrice = Math.max(0, parseInt(inputFinalPrice, 10) || 0);

    // 若修改的是第一個基準選項（中杯），且差價為 0，同步更新全商品基本價格
    const isBaseOption = sizeGroup.options[0]?.id === optionId;
    if (isBaseOption) {
      setBasePrice(String(numericFinalPrice));
    }

    const calculatedAdj = numericFinalPrice - (isBaseOption ? numericFinalPrice : basePrice);

    const updatedOptions = sizeGroup.options.map((opt) =>
      opt.id === optionId ? { ...opt, price_adjustment: calculatedAdj } : opt
    );
    updateSizeGroupOptions(updatedOptions);
  };

  // 5. 新增其他自訂尺寸（如特大杯 XL, 小杯 S, 瓶裝等）
  const handleAddCustomSize = (presetName: string = '特大杯 (XL)', defaultExtraPrice: number = 20) => {
    if (!sizeGroup) return;
    const timestamp = Date.now();
    const newOption = {
      id: `opt-size-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      name: presetName,
      price_adjustment: defaultExtraPrice,
    };
    updateSizeGroupOptions([...sizeGroup.options, newOption]);
  };

  // 6. 移除某尺寸
  const handleRemoveSizeOption = (optionId: string) => {
    if (!sizeGroup) return;
    if (sizeGroup.options.length <= 1) {
      handleDisableSizePricing();
      return;
    }
    const updatedOptions = sizeGroup.options.filter((opt) => opt.id !== optionId);
    updateSizeGroupOptions(updatedOptions);
  };

  const updateSizeGroupOptions = (newOptions: CustomGroup['options']) => {
    if (!sizeGroup) return;
    const updatedGroup = { ...sizeGroup, options: newOptions };
    setProductCustomGroups((prev) =>
      prev.map((g) => (isSizeCustomGroup(g) ? updatedGroup : g))
    );
  };

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/70 via-indigo-50/40 to-slate-50 dark:from-[#131E33] dark:via-[#162238] dark:to-[#111A2C] border border-sky-200/80 dark:border-sky-800/60 space-y-3">
      {/* 頂部標題與開關 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            🥛
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>容量尺寸與個別定價</span>
              {isEnabled && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-sky-500 text-white shadow-2xs">
                  已啟用
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              中杯/大杯分別設定售價，並可自由新增其他大小尺寸
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={isEnabled ? handleDisableSizePricing : handleEnableSizePricing}
          className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs ${
            isEnabled
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
              : 'bg-sky-500 text-white border-sky-500 hover:bg-sky-600'
          }`}
        >
          {isEnabled ? '關閉尺寸多定價' : '一鍵啟用中/大杯'}
        </button>
      </div>

      {/* 啟用狀態下的尺寸編輯面板 */}
      {isEnabled && sizeGroup && (
        <div className="space-y-2.5 pt-1">
          <div className="space-y-2">
            {sizeGroup.options.map((option, index) => {
              const finalPrice = basePrice + option.price_adjustment;

              return (
                <div
                  key={option.id}
                  className="flex items-center gap-2 bg-white dark:bg-[#182338] p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                >
                  {/* 序號標記 */}
                  <div className="w-5 h-5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>

                  {/* 尺寸名稱 */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option.name}
                      placeholder="尺寸名稱 (如：中杯)"
                      onChange={(e) => handleUpdateOptionName(option.id, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#111A2C] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg py-1 px-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </div>

                  {/* 售價輸入框 ($) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-black text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      value={finalPrice}
                      onChange={(e) => handleUpdateOptionPrice(option.id, e.target.value)}
                      placeholder="售價"
                      className="w-16 bg-slate-50 dark:bg-[#111A2C] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg py-1 px-2 text-xs font-black text-center focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                    <span className="text-[11px] font-bold text-slate-500">元</span>
                  </div>

                  {/* 差價指示 */}
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      option.price_adjustment > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : option.price_adjustment < 0
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {option.price_adjustment >= 0 ? `+${option.price_adjustment}` : option.price_adjustment}
                  </span>

                  {/* 刪除按鈕 */}
                  <button
                    type="button"
                    onClick={() => handleRemoveSizeOption(option.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer"
                    title="刪除此尺寸"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* ➕ 預留擴充其他大小功能與快捷預設標籤 */}
          <div className="pt-1.5 border-t border-sky-100 dark:border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3 h-3 text-sky-500" />
                <span>快速擴充其他尺寸：</span>
              </span>

              <button
                type="button"
                onClick={() => handleAddCustomSize('自訂尺寸', 15)}
                className="text-xs font-extrabold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 新增自訂尺寸</span>
              </button>
            </div>

            {/* 常用尺寸快捷按鈕膠囊 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { name: '特大杯 (XL)', extra: 20 },
                { name: '分享瓶 (Bottle)', extra: 40 },
                { name: '小杯 (S)', extra: -10 },
                { name: '小份', extra: 0 },
                { name: '大份 (加大)', extra: 25 },
                { name: '家庭號', extra: 50 },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddCustomSize(preset.name, preset.extra)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
