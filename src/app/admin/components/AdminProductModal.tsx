'use client';

import React from 'react';
import { MenuItem, CustomGroup } from '@/types/database';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

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
                <option value="false">正常供應中</option>
                <option value="true">暫時售完 / 下架</option>
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

          {/* 客製化規格選項管理 */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                客製化規格選項 (例如：甜度、冰塊、加料)
              </span>
              <button
                type="button"
                onClick={onAddCustomGroup}
                className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-100 dark:border-slate-700 transition active:scale-95 cursor-pointer"
              >
                ＋ 新增規格組
              </button>
            </div>

            {productCustomGroups.length === 0 ? (
              <div className="bg-slate-50 dark:bg-[#182234] p-4 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                此餐點為基本款（無客製化規格選項）
              </div>
            ) : (
              productCustomGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-slate-50 dark:bg-[#182234] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <div className="flex gap-2 items-center">
                    <input
                      id={`group-title-${group.id}`}
                      name={`group_title_${group.id}`}
                      aria-label="規格組名稱"
                      type="text"
                      required
                      placeholder="規格組名稱 (例：甜度)"
                      value={group.title}
                      onChange={(e) =>
                        setProductCustomGroups(
                          productCustomGroups.map((g) => (g.id === group.id ? { ...g, title: e.target.value } : g))
                        )
                      }
                      className="flex-1 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-bold"
                    />
                    <select
                      id={`group-type-${group.id}`}
                      name={`group_type_${group.id}`}
                      aria-label="規格選擇類型"
                      value={group.type}
                      onChange={(e) =>
                        setProductCustomGroups(
                          productCustomGroups.map((g) =>
                            g.id === group.id ? { ...g, type: e.target.value as 'single' | 'limit' | 'any' } : g
                          )
                        )
                      }
                      className="bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-bold"
                    >
                      <option value="single">單選 (必選 1)</option>
                      <option value="limit">限量選 (最多 N)</option>
                      <option value="any">自由選 (多選)</option>
                    </select>

                    {group.type === 'limit' && (
                      <input
                        id={`group-limit-${group.id}`}
                        name={`group_limit_${group.id}`}
                        aria-label="最多可選數量"
                        type="number"
                        min="1"
                        placeholder="上限"
                        value={group.limit_number || 1}
                        onChange={(e) =>
                          setProductCustomGroups(
                            productCustomGroups.map((g) =>
                              g.id === group.id ? { ...g, limit_number: Number(e.target.value) } : g
                            )
                          )
                        }
                        className="w-14 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-bold text-center"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => onRemoveCustomGroup(group.id)}
                      className="text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg font-bold cursor-pointer transition"
                      title="刪除客製群組"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                    {group.options.map((opt) => (
                      <div key={opt.id} className="flex gap-2 items-center">
                        <input
                          id={`opt-name-${opt.id}`}
                          name={`opt_name_${opt.id}`}
                          aria-label="選項名稱"
                          type="text"
                          required
                          placeholder="選項名稱 (例：半糖)"
                          value={opt.name}
                          onChange={(e) =>
                            setProductCustomGroups(
                              productCustomGroups.map((g) =>
                                g.id === group.id
                                  ? {
                                      ...g,
                                      options: g.options.map((o) =>
                                        o.id === opt.id ? { ...o, name: e.target.value } : o
                                      ),
                                    }
                                  : g
                              )
                            )
                          }
                          className="flex-1 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-1.5 rounded-lg text-xs font-bold"
                        />
                        <input
                          id={`opt-price-${opt.id}`}
                          name={`opt_price_${opt.id}`}
                          aria-label="加價金額"
                          type="number"
                          placeholder="加價 ($)"
                          value={opt.price_adjustment}
                          onChange={(e) =>
                            setProductCustomGroups(
                              productCustomGroups.map((g) =>
                                g.id === group.id
                                  ? {
                                      ...g,
                                      options: g.options.map((o) =>
                                        o.id === opt.id ? { ...o, price_adjustment: Number(e.target.value) } : o
                                      ),
                                    }
                                  : g
                              )
                            )
                          }
                          className="w-20 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-1.5 rounded-lg text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveOptionFromGroup(group.id, opt.id)}
                          className="text-xs text-rose-400 hover:text-rose-600 font-bold p-1 cursor-pointer transition"
                          title="刪除選項"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => onAddOptionToGroup(group.id)}
                      className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>新增子選項</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

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
