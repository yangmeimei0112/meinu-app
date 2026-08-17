'use client';

import React from 'react';
import { Category, Store } from '@/types/database';

interface AdminStoreModalProps {
  isOpen: boolean;
  editingStore: Store | null;
  categories: Category[];
  storeForm: { name: string; category_id: string };
  setStoreForm: React.Dispatch<React.SetStateAction<{ name: string; category_id: string }>>;
  storeImagePreview: string;
  uploadingImage: boolean;
  onClose: () => void;
  onSaveStore: (e: React.FormEvent) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AdminStoreModal({
  isOpen,
  editingStore,
  categories,
  storeForm,
  setStoreForm,
  storeImagePreview,
  uploadingImage,
  onClose,
  onSaveStore,
  onImageChange,
}: AdminStoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 shadow-2xl">
        <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
          {editingStore ? '✏️ 編輯店家資訊' : '🏪 新增合作店家'}
        </h3>

        <form onSubmit={onSaveStore} className="space-y-3">
          <div>
            <label htmlFor="store-form-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              店家名稱
            </label>
            <input
              id="store-form-name"
              name="storeName"
              type="text"
              required
              placeholder="例如：50嵐"
              value={storeForm.name}
              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label htmlFor="store-form-category" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              店家分類
            </label>
            <select
              id="store-form-category"
              name="storeCategory"
              value={storeForm.category_id}
              onChange={(e) => setStoreForm({ ...storeForm, category_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="store-form-image" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                店家封面照片
              </label>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                💡 建議像素：800 x 600 px (自動轉 WebP)
              </span>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl p-3">
              {storeImagePreview ? (
                <img
                  src={storeImagePreview}
                  alt="預覽"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-400 dark:text-slate-300 font-bold">
                  無照片
                </div>
              )}

              <div className="flex-1">
                <input
                  id="store-form-image"
                  name="storeImage"
                  type="file"
                  aria-label="上傳店家封面照片"
                  accept="image/*"
                  onChange={onImageChange}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-50 dark:file:bg-slate-800 file:text-sky-600 dark:file:text-sky-400 hover:file:bg-sky-100 dark:hover:file:bg-slate-700 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">前端自動壓縮為輕量 WebP 格式</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {uploadingImage ? '上傳中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
