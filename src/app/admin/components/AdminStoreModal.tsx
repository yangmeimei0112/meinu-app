'use client';

import React, { useMemo } from 'react';
import { Category, Store } from '@/types/database';
import { Pencil, Store as StoreIcon, AlertTriangle, Lightbulb } from 'lucide-react';

interface AdminStoreModalProps {
  isOpen: boolean;
  editingStore: Store | null;
  categories: Category[];
  stores: Store[];
  storeForm: { name: string; category_id: string; code_number: string };
  setStoreForm: React.Dispatch<React.SetStateAction<{ name: string; category_id: string; code_number: string }>>;
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
  stores,
  storeForm,
  setStoreForm,
  storeImagePreview,
  uploadingImage,
  onClose,
  onSaveStore,
  onImageChange,
}: AdminStoreModalProps) {
  // -------------------------------------------------------------
  // 💡 智慧計算「最小可用編碼 (填補斷層)」與「最大可用編碼 (最新遞增)」
  // -------------------------------------------------------------
  const { minSuggestedNumber, maxSuggestedNumber, isDuplicateConflict } = useMemo(() => {
    const usedNumbers = new Set<number>();

    stores.forEach((s) => {
      // 排除當前正在編輯的店家自身
      if (editingStore && s.id === editingStore.id) return;
      if (s.code) {
        const num = parseInt(s.code.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 0) {
          usedNumbers.add(num);
        }
      }
    });

    // 1. 計算最小可用正整數 (Min Available Gap)
    let minAvail = 1;
    while (usedNumbers.has(minAvail)) {
      minAvail++;
    }

    // 2. 計算最大序號 + 1 (Max Next)
    const maxUsed = usedNumbers.size > 0 ? Math.max(...Array.from(usedNumbers)) : 0;
    const maxAvail = maxUsed + 1;

    // 3. 檢查當前輸入值是否衝突重複
    const currentInputNumber = parseInt(storeForm.code_number.replace(/\D/g, ''), 10);
    const isConflict = !isNaN(currentInputNumber) && usedNumbers.has(currentInputNumber);

    return {
      minSuggestedNumber: String(minAvail).padStart(3, '0'),
      maxSuggestedNumber: String(maxAvail).padStart(3, '0'),
      isDuplicateConflict: isConflict,
    };
  }, [stores, editingStore, storeForm.code_number]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 shadow-2xl">
        <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
          {editingStore ? (
            <span className="flex items-center justify-center gap-1.5">
              <Pencil className="w-4 h-4 text-sky-500" />
              <span>編輯店家資訊與編號</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <StoreIcon className="w-4 h-4 text-sky-500" />
              <span>新增合作店家</span>
            </span>
          )}
        </h3>

        <form onSubmit={onSaveStore} className="space-y-3.5">
          {/* 商家專屬編號 (S-??? 純數字防呆輸入) */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-[#182234] p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label htmlFor="store-form-code-input" className="text-xs font-black text-slate-700 dark:text-slate-200">
                商家專屬編號 (S-???)
              </label>
              <span className="text-[10px] text-slate-400 font-bold">格式：S- ＋ 純數字</span>
            </div>

            {/* 固定前綴徽章 ＋ 純數字輸入槽 */}
            <div className={`flex items-center rounded-xl border bg-white dark:bg-[#0E1726] overflow-hidden transition ${
              isDuplicateConflict
                ? 'border-rose-500 ring-2 ring-rose-500/30'
                : 'border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-sky-400'
            }`}>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-sky-400 font-mono font-black text-xs px-3 py-2 select-none border-r border-slate-200 dark:border-slate-700">
                S-
              </span>
              <input
                id="store-form-code-input"
                name="storeCodeNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                placeholder="001"
                value={storeForm.code_number}
                onChange={(e) => {
                  // 🛡️ 0ms 即時過濾：只保留純數字
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setStoreForm({ ...storeForm, code_number: digitsOnly });
                }}
                className="w-full bg-transparent px-3 py-2 text-xs font-mono font-black text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
              />
            </div>

            {/* 衝突重複警示提示 */}
            {isDuplicateConflict ? (
              <p className="text-[11px] font-black text-rose-500 dark:text-rose-400 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>商家編號「S-{storeForm.code_number.padStart(3, '0')}」已被佔用，不可重複！</span>
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                儲存將自動標準化為：<span className="font-mono font-bold text-sky-600 dark:text-sky-400">S-{storeForm.code_number ? storeForm.code_number.padStart(3, '0') : '001'}</span>
              </p>
            )}

            {/* 智慧編碼建議按鈕膠囊 (最小可用空缺 & 最大遞增序號) */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400">建議號碼：</span>
              <button
                type="button"
                onClick={() => setStoreForm({ ...storeForm, code_number: minSuggestedNumber })}
                className="text-[10px] font-black font-mono px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition cursor-pointer flex items-center gap-1"
                title="填補前面空缺的最小號碼"
              >
                <Lightbulb className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>最小空缺: S-{minSuggestedNumber}</span>
              </button>

              {minSuggestedNumber !== maxSuggestedNumber && (
                <button
                  type="button"
                  onClick={() => setStoreForm({ ...storeForm, code_number: maxSuggestedNumber })}
                  className="text-[10px] font-black font-mono px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer flex items-center gap-1"
                  title="接續末端最新號碼"
                >
                  <Lightbulb className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>最大序號: S-{maxSuggestedNumber}</span>
                </button>
              )}
            </div>
          </div>

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
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                <span>建議像素：800 x 600 px (自動轉 WebP)</span>
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
              disabled={uploadingImage || isDuplicateConflict || !storeForm.code_number.trim()}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {uploadingImage ? '上傳中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
