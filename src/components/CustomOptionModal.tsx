'use client';

import { useState, useEffect } from 'react';
import { MenuItem, CustomGroup } from '@/types/database';

interface CustomOptionModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, selectedOptionsText: string, finalUnitPrice: number) => void;
}

export default function CustomOptionModal({ item, isOpen, onClose, onAddToCart }: CustomOptionModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item && item.custom_groups) {
      const initialSelections: Record<string, string[]> = {};
      item.custom_groups.forEach((group) => {
        if (group.type === 'single' && group.options.length > 0) {
          initialSelections[group.id] = [group.options[0].id];
        } else {
          initialSelections[group.id] = [];
        }
      });
      setSelectedOptions(initialSelections);
      setErrorMsg(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const groups = item.custom_groups || [];

  const handleSelectOption = (group: CustomGroup, optionId: string) => {
    setErrorMsg(null);
    const currentList = selectedOptions[group.id] || [];

    if (group.type === 'single') {
      setSelectedOptions({ ...selectedOptions, [group.id]: [optionId] });
    } else if (group.type === 'any') {
      const updated = currentList.includes(optionId)
        ? currentList.filter((id) => id !== optionId)
        : [...currentList, optionId];
      setSelectedOptions({ ...selectedOptions, [group.id]: updated });
    } else if (group.type === 'limit') {
      const limitMax = group.limit_number || 1;
      if (currentList.includes(optionId)) {
        setSelectedOptions({ ...selectedOptions, [group.id]: currentList.filter((id) => id !== optionId) });
      } else {
        if (currentList.length >= limitMax) {
          setErrorMsg(`「${group.title}」最多只能選擇 ${limitMax} 個選項！`);
          return;
        }
        setSelectedOptions({ ...selectedOptions, [group.id]: [...currentList, optionId] });
      }
    }
  };

  let totalExtraPrice = 0;
  const selectedNames: string[] = [];

  groups.forEach((group) => {
    const selectedIds = selectedOptions[group.id] || [];
    group.options.forEach((opt) => {
      if (selectedIds.includes(opt.id)) {
        totalExtraPrice += opt.price_adjustment || 0;
        selectedNames.push(opt.name);
      }
    });
  });

  const finalUnitPrice = item.price + totalExtraPrice;

  const handleConfirm = () => {
    for (const group of groups) {
      const selected = selectedOptions[group.id] || [];
      if (group.type === 'single' && selected.length === 0) {
        setErrorMsg(`請選擇「${group.title}」（必選 1 個）`);
        return;
      }
      if (group.type === 'limit' && group.limit_number && selected.length === 0) {
        setErrorMsg(`請選擇「${group.title}」（限制選擇 ${group.limit_number} 個）`);
        return;
      }
    }

    const optionsText = selectedNames.length > 0 ? `[${selectedNames.join(', ')}]` : '';
    onAddToCart(item, optionsText, finalUnitPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">{item.name}</h3>
            {item.description && <p className="text-xs text-slate-400 font-medium mt-0.5">{item.description}</p>}
            <p className="text-xs text-sky-600 font-extrabold mt-1">基本單價 ${item.price} 元</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 font-bold hover:bg-slate-200 transition flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-2.5 rounded-xl border border-red-100 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {groups.map((group) => {
            const currentSelected = selectedOptions[group.id] || [];
            return (
              <div key={group.id} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-705">
                  <span>{group.title}</span>
                  <span className="text-[10px] text-slate-400">
                    {group.type === 'single' && '必選 1 個'}
                    {group.type === 'any' && '可不選或多選'}
                    {group.type === 'limit' && `最多選 ${group.limit_number || 1} 個`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {group.options.map((opt) => {
                    const isChecked = currentSelected.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(group, opt.id)}
                        className={`p-2.5 rounded-2xl text-xs font-bold border text-left transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/80'
                        }`}
                      >
                        <span className="truncate mr-1">{opt.name}</span>
                        {opt.price_adjustment > 0 ? (
                          <span className={`text-[10px] font-extrabold shrink-0 ${isChecked ? 'text-white' : 'text-sky-600'}`}>
                            +${opt.price_adjustment}
                          </span>
                        ) : (
                          <span className={`text-[10px] ${isChecked ? 'text-sky-100' : 'text-slate-400'}`}>+0</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">合計金額</span>
            <span className="text-lg font-extrabold text-sky-600">${finalUnitPrice} 元</span>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition active:scale-95"
          >
            加入購物車
          </button>
        </div>
      </div>
    </div>
  );
}