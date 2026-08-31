'use client';

import React from 'react';
import { MenuItem, CustomGroup } from '@/types/database';
import { Pencil, Plus } from 'lucide-react';
import { ProductCustomGroupsManager } from './product-modal/ProductCustomGroupsManager';

interface ProductFormState {
  name: string;
  price: string;
  description: string;
  stock_quantity: string;
  is_sold_out: boolean;
}

interface AdminProductModalProps {
  isOpen: boolean;
  editingProduct: MenuItem | null;
  productForm: ProductFormState;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  productCustomGroups: CustomGroup[];
  setProductCustomGroups: React.Dispatch<React.SetStateAction<CustomGroup[]>>;
  onClose: () => void;
  onSaveProduct: (e: React.FormEvent) => void;
  onAddCustomGroup: () => void;
  onRemoveCustomGroup: (groupId: string) => void;
  onAddOptionToGroup: (groupId: string) => void;
  onRemoveOptionFromGroup: (groupId: string, optionId: string) => void;
}

export default function AdminProductModal({
  isOpen,
  editingProduct,
  productForm,
  setProductForm,
  productCustomGroups,
  setProductCustomGroups,
  onClose,
  onSaveProduct,
  onAddCustomGroup,
  onRemoveCustomGroup,
  onAddOptionToGroup,
  onRemoveOptionFromGroup,
}: AdminProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-lg rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
          {editingProduct ? (
            <span className="flex items-center justify-center gap-1.5">
              <Pencil className="w-4 h-4 text-sky-500" />
              <span>編輯餐點與客製化選項</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4 text-sky-500" />
              <span>新增餐點</span>
            </span>
          )}
        </h3>

        <form onSubmit={onSaveProduct} className="space-y-3">
          <div>
            <label htmlFor="prod-form-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              餐點名稱 *
            </label>
            <input
              id="prod-form-name"
              name="productName"
              type="text"
              required
              placeholder="例如：珍珠奶茶"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-form-price" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                基本價格 ($) *
              </label>
              <input
                id="prod-form-price"
                name="productPrice"
                type="number"
                required
                min="0"
                placeholder="例如：50"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div>
              <label htmlFor="prod-form-soldout" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                是否售完/停售
              </label>
              <select
                id="prod-form-soldout"
                name="productIsSoldOut"
                value={productForm.is_sold_out ? 'true' : 'false'}
                onChange={(e) => setProductForm({ ...productForm, is_sold_out: e.target.value === 'true' })}
                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="false" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">正常供應中</option>
                <option value="true" className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100">暫時售完 / 下架</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prod-form-desc" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              餐點簡介描述 (選填)
            </label>
            <textarea
              id="prod-form-desc"
              name="productDescription"
              rows={2}
              placeholder="簡短介紹這道餐點的特色或美味之處..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-medium mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 客製化規格選項管理組件 */}
          <ProductCustomGroupsManager
            productCustomGroups={productCustomGroups}
            setProductCustomGroups={setProductCustomGroups}
            onAddCustomGroup={onAddCustomGroup}
            onRemoveCustomGroup={onRemoveCustomGroup}
            onAddOptionToGroup={onAddOptionToGroup}
            onRemoveOptionFromGroup={onRemoveOptionFromGroup}
          />

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer"
            >
              儲存餐點
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
