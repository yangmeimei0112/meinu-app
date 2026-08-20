'use client';

import React from 'react';
import { CustomGroup } from '@/types/database';

interface CustomModalOptionGroupProps {
  group: CustomGroup;
  selectedOptionIds: string[];
  onSelectOption: (group: CustomGroup, optionId: string) => void;
}

export function CustomModalOptionGroup({
  group,
  selectedOptionIds,
  onSelectOption,
}: CustomModalOptionGroupProps) {
  return (
    <div className="pt-3 first:pt-0 space-y-2">
      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
        <span className="flex items-center gap-1">
          <span>{group.title}</span>
          {group.type === 'single' && <span className="text-sky-500">*</span>}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
          {group.type === 'single' && '必選 1 個'}
          {group.type === 'any' && '可多選或不選'}
          {group.type === 'limit' && `最多選 ${group.limit_number || 1} 個`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {group.options.map((opt) => {
          const isChecked = selectedOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectOption(group, opt.id)}
              className={`p-2.5 rounded-2xl text-xs font-bold border text-left transition flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                isChecked
                  ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-700'
              }`}
            >
              <span className="truncate mr-1">{opt.name}</span>
              {opt.price_adjustment > 0 ? (
                <span
                  className={`text-[10px] font-extrabold shrink-0 ${
                    isChecked ? 'text-white' : 'text-sky-600 dark:text-sky-400'
                  }`}
                >
                  +${opt.price_adjustment}
                </span>
              ) : (
                <span
                  className={`text-[10px] ${
                    isChecked ? 'text-sky-100' : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  +0
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
