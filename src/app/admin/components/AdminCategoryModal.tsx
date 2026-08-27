'use client';

import React from 'react';
import { Category } from '@/types/database';
import { Pencil, Tag } from 'lucide-react';

interface AdminCategoryModalProps {
  isOpen: boolean;
  editingCat: Category | null;
  catNameInput: string;
  setCatNameInput: (val: string) => void;
  onClose: () => void;
  onSaveCategory: (e: React.FormEvent) => void;
}

export default function AdminCategoryModal({
  isOpen,
  editingCat,
  catNameInput,
  setCatNameInput,
  onClose,
  onSaveCategory,
}: AdminCategoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 shadow-2xl">
        <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
          {editingCat ? (
            <span className="flex items-center justify-center gap-1.5">
              <Pencil className="w-4 h-4 text-sky-500" />
              <span>編輯類別名稱</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Tag className="w-4 h-4 text-sky-500" />
              <span>新增類別</span>
            </span>
          )}
        </h3>

        <form onSubmit={onSaveCategory} className="space-y-3">
          <div>
            <label htmlFor="cat-form-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              類別名稱
            </label>
            <input
              id="cat-form-name"
              name="categoryName"
              type="text"
              required
              placeholder="例如：手搖飲料"
              value={catNameInput}
              onChange={(e) => setCatNameInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
