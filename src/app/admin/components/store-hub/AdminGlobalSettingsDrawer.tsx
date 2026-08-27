'use client';

import React, { useState } from 'react';
import type { Category, PaymentMethod, SoldOutOption } from '@/types/database';
import { Tag, CreditCard, AlertTriangle, Plus, ChevronUp, ChevronDown, X } from 'lucide-react';
import { PaymentMethodIcon, SoldOutOptionIcon } from '@/lib/icon-utils';

interface AdminGlobalSettingsDrawerProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  onCreateCategory: () => void;
  onMoveCategory: (id: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, field: 'name', value: string) => void;
  onCreatePaymentMethod: () => void;
  onDeletePaymentMethod: (id: string) => void;
  onTogglePaymentMethodActive: (id: string, currentStatus: boolean) => void;
  onUpdatePaymentMethod: (id: string, field: 'name' | 'account_info', value: string | null) => void;
  onSavePaymentMethod: (id: string, payload: { name: string; account_info: string | null }) => void;
  onCreateSoldOutOption: () => void;
  onDeleteSoldOutOption: (id: string) => void;
  onMoveSoldOutOption: (id: string, direction: 'up' | 'down') => void;
  onUpdateSoldOutOption: (id: string, title: string) => void;
  onSaveSoldOutOption: (id: string, title: string) => void;
}

export function AdminGlobalSettingsDrawer({
  categories,
  paymentMethods,
  soldOutOptions,
  onCreateCategory,
  onMoveCategory,
  onDeleteCategory,
  onUpdateCategory,
  onCreatePaymentMethod,
  onDeletePaymentMethod,
  onTogglePaymentMethodActive,
  onUpdatePaymentMethod,
  onSavePaymentMethod,
  onCreateSoldOutOption,
  onDeleteSoldOutOption,
  onMoveSoldOutOption,
  onUpdateSoldOutOption,
  onSaveSoldOutOption,
}: AdminGlobalSettingsDrawerProps) {
  const [globalSettingTab, setGlobalSettingTab] = useState<'categories' | 'payments' | 'sold_outs'>('categories');

  return (
    <div className="bg-white/90 dark:bg-[#152033]/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
      <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl text-xs font-black text-slate-600 dark:text-slate-300 max-w-md border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setGlobalSettingTab('categories')}
          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            globalSettingTab === 'categories'
              ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Tag className="w-3 h-3" />
          <span>商品分類 ({categories.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setGlobalSettingTab('payments')}
          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            globalSettingTab === 'payments'
              ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <CreditCard className="w-3 h-3" />
          <span>付款方式 ({paymentMethods.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setGlobalSettingTab('sold_outs')}
          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            globalSettingTab === 'sold_outs'
              ? 'bg-white dark:bg-sky-500 text-slate-900 dark:text-white shadow-xs'
              : 'hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>缺貨備案 ({soldOutOptions.length})</span>
        </button>
      </div>

      {/* 1. 全域分類管理 */}
      {globalSettingTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">商品分類排序與管理</span>
            <button
              type="button"
              onClick={onCreateCategory}
              className="text-xs font-black bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>新增分類</span>
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              尚無商品分類，請點擊上方按鈕新增
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-slate-50 dark:bg-[#0E1726] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                >
                  <input
                    id={`cat-item-${cat.id}`}
                    name={`category_${cat.id}_name`}
                    aria-label={`分類名稱 ${cat.name}`}
                    value={cat.name}
                    onChange={(e) => onUpdateCategory(cat.id, 'name', e.target.value)}
                    className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onMoveCategory(cat.id, 'up')}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                    aria-label="上移"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveCategory(cat.id, 'down')}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                    aria-label="下移"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(cat.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-black p-1 cursor-pointer"
                    aria-label="刪除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. 全域付款方式管理 */}
      {globalSettingTab === 'payments' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">付款方式與收款帳號 (支援自訂)</span>
            <button
              type="button"
              onClick={onCreatePaymentMethod}
              className="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>新增付款方式</span>
            </button>
          </div>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              尚無付款方式，請點擊上方按鈕新增
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="bg-slate-50 dark:bg-[#0E1726] p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <PaymentMethodIcon name={method.name} className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input
                      id={`pm-item-${method.id}`}
                      name={`pm_${method.id}_name`}
                      aria-label={`付款方式名稱 ${method.name}`}
                      value={method.name}
                      onChange={(e) => onUpdatePaymentMethod(method.id, 'name', e.target.value)}
                      className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onTogglePaymentMethodActive(method.id, method.is_active)}
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border cursor-pointer ${
                        method.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300'
                      }`}
                    >
                      {method.is_active ? '啟用中' : '已停用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSavePaymentMethod(method.id, { name: method.name, account_info: method.account_info })}
                      className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePaymentMethod(method.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-black p-1 cursor-pointer"
                      aria-label="刪除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    placeholder="收款帳號或備註 (選填，例如：郵局 700-00000000000000)"
                    value={method.account_info || ''}
                    onChange={(e) => onUpdatePaymentMethod(method.id, 'account_info', e.target.value)}
                    className="w-full text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#152033] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. 全域缺貨備案管理 */}
      {globalSettingTab === 'sold_outs' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">缺貨備案選項設定</span>
            <button
              type="button"
              onClick={onCreateSoldOutOption}
              className="text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1.5 rounded-xl shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>新增備案</span>
            </button>
          </div>
          {soldOutOptions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              尚無缺貨備案，請點擊上方按鈕新增
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {soldOutOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="bg-slate-50 dark:bg-[#0E1726] p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                >
                  <SoldOutOptionIcon title={opt.title} className="w-4 h-4 text-rose-500 shrink-0" />
                  <input
                    id={`so-item-${opt.id}`}
                    name={`so_${opt.id}_title`}
                    aria-label={`缺貨備案 ${opt.title}`}
                    value={opt.title}
                    onChange={(e) => onUpdateSoldOutOption(opt.id, e.target.value)}
                    className="flex-1 text-xs font-black text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onSaveSoldOutOption(opt.id, opt.title)}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    儲存
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSoldOutOption(opt.id, 'up')}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                    aria-label="上移"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSoldOutOption(opt.id, 'down')}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center font-black"
                    aria-label="下移"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSoldOutOption(opt.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-black p-1 cursor-pointer"
                    aria-label="刪除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
