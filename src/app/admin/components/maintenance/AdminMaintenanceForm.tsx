'use client';

import React from 'react';
import { MaintenanceData } from '@/components/MaintenanceGuard';
import type { MaintenanceScope } from '@/app/api/system/maintenance/route';
import {
  X,
  Lightbulb,
  Upload,
  Save,
  Globe,
  Home,
  Search,
  Store,
  ShoppingBag,
  CreditCard,
  ClipboardList,
  Layers,
  UserCheck,
  ShieldCheck,
  Check,
  CheckSquare,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

const QUICK_REASONS = [
  '系統例行升級',
  '菜單規格重整',
  '效能優化更新',
  '金流維護升級',
  '資料庫同步維護',
];

interface ScopeOption {
  id: MaintenanceScope;
  label: string;
  pathDesc: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  isAll?: boolean;
}

const SCOPE_OPTIONS: ScopeOption[] = [
  { id: 'all', label: '全站所有頁面', pathDesc: '/* 全部前台', desc: '封鎖全站所有前台頁面', icon: Globe, isAll: true },
  { id: 'home', label: '首頁大廳', pathDesc: '/', desc: '僅鎖定首頁大廳', icon: Home },
  { id: 'search', label: '探索搜尋頁', pathDesc: '/search', desc: '僅鎖定搜尋與店家列表', icon: Search },
  { id: 'stores', label: '店家菜單頁', pathDesc: '/stores/*', desc: '僅鎖定店家菜單點餐頁', icon: Store },
  { id: 'cart', label: '購物車功能', pathDesc: '/cart', desc: '僅鎖定購物車檢視與操作', icon: ShoppingBag },
  { id: 'checkout', label: '結帳送單頁', pathDesc: '/checkout', desc: '僅鎖定結帳送出訂單流程', icon: CreditCard },
  { id: 'my-orders', label: '歷史訂單頁', pathDesc: '/my-orders', desc: '僅鎖定歷史訂單查閱', icon: ClipboardList },
  { id: 'account', label: '會員專區頁', pathDesc: '/account', desc: '僅鎖定個人帳號與設定', icon: UserCheck },
  { id: 'legal', label: '法律協議中心', pathDesc: '/legal/*', desc: '僅鎖定服務條款與政策', icon: ShieldCheck },
];

const ALL_SUB_SCOPES: MaintenanceScope[] = [
  'home',
  'search',
  'stores',
  'cart',
  'checkout',
  'my-orders',
  'account',
  'legal',
];

interface AdminMaintenanceFormProps {
  config: MaintenanceData;
  setConfig: React.Dispatch<React.SetStateAction<MaintenanceData>>;
  saving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSaveConfig: (overrideState?: boolean) => Promise<void>;
}

export function AdminMaintenanceForm({
  config,
  setConfig,
  saving,
  fileInputRef,
  onImageUpload,
  onRemoveImage,
  onSaveConfig,
}: AdminMaintenanceFormProps) {
  const activeScopes: MaintenanceScope[] =
    config.scopes && config.scopes.length > 0
      ? config.scopes
      : [config.scope || 'all'];

  const isAllSelected = activeScopes.includes('all');

  const handleToggleScope = (scopeId: MaintenanceScope) => {
    if (scopeId === 'all') {
      setConfig((prev) => ({
        ...prev,
        scope: 'all',
        scopes: ['all'],
      }));
      return;
    }

    let newScopes: MaintenanceScope[];
    if (isAllSelected) {
      // 若原先為全站，點選單項則切換為僅選取該單項
      newScopes = [scopeId];
    } else {
      if (activeScopes.includes(scopeId)) {
        newScopes = activeScopes.filter((s) => s !== scopeId);
        // 若全部取消勾選，預設回到全站
        if (newScopes.length === 0) {
          newScopes = ['all'];
        }
      } else {
        newScopes = [...activeScopes, scopeId];
      }
    }

    const primaryScope = newScopes.includes('all') ? 'all' : newScopes[0] || 'all';

    setConfig((prev) => ({
      ...prev,
      scope: primaryScope,
      scopes: newScopes,
    }));
  };

  const handleApplyPreset = (scopes: MaintenanceScope[]) => {
    const primaryScope = scopes.includes('all') ? 'all' : scopes[0] || 'all';
    setConfig((prev) => ({
      ...prev,
      scope: primaryScope,
      scopes: scopes,
    }));
  };

  const selectedCountText = isAllSelected
    ? '全站所有頁面'
    : `已選取 ${activeScopes.length} 個頁面（${activeScopes
        .map((s) => SCOPE_OPTIONS.find((opt) => opt.id === s)?.label || s)
        .join('、')}）`;

  return (
    <div className="space-y-4">
      {/* 1. 主開關卡片 */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#131B2B] border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">維護模式總開關</span>
            <span className="text-[11px] text-slate-400">
              開啟後將依據下方勾選之「多選維護範圍」進行阻擋與鎖定
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_maintenance}
              onChange={(e) => {
                const nextState = e.target.checked;
                setConfig((prev) => ({ ...prev, is_maintenance: nextState }));
                onSaveConfig(nextState);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500" />
          </label>
        </div>
      </div>

      {/* 2. 🌟 維護生效範圍選擇器 (支援多選/複選單一或複合頁面維護) */}
      <div className="space-y-3 p-4 rounded-3xl bg-slate-50 dark:bg-[#131B2B] border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>維護生效範圍（支援複選多頁面）</span>
          </label>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold font-mono">
            {isAllSelected ? '🌐 全站維護' : `⚡ 複選 ${activeScopes.length} 個分頁`}
          </span>
        </div>

        {/* 快捷套用預設組合按鈕 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] font-bold text-slate-400">快捷套用：</span>
          <button
            type="button"
            onClick={() => handleApplyPreset(['all'])}
            className={`text-[10px] font-extrabold px-2 py-0.8 rounded-lg border transition active:scale-95 cursor-pointer flex items-center gap-1 ${
              isAllSelected
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <Globe className="w-2.5 h-2.5" />
            <span>全站鎖定</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset(['stores', 'cart', 'checkout'])}
            className="text-[10px] font-extrabold px-2 py-0.8 rounded-lg border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 active:scale-95 transition cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-sky-500" />
            <span>核心點餐流程 (菜單+購物車+結帳)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset(ALL_SUB_SCOPES)}
            className="text-[10px] font-extrabold px-2 py-0.8 rounded-lg border bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 active:scale-95 transition cursor-pointer flex items-center gap-1"
          >
            <CheckSquare className="w-2.5 h-2.5 text-emerald-500" />
            <span>全選子頁面</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset(['all'])}
            className="text-[10px] font-bold px-2 py-0.8 rounded-lg border bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700 active:scale-95 transition cursor-pointer flex items-center gap-1"
            title="重設為全站維護"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>重設</span>
          </button>
        </div>

        {/* 複選 Checkbox 卡片矩陣清單 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {SCOPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isChecked = opt.isAll ? isAllSelected : !isAllSelected && activeScopes.includes(opt.id);

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleToggleScope(opt.id)}
                className={`p-2.5 rounded-2xl border text-left transition active:scale-95 cursor-pointer flex flex-col justify-between gap-1 relative overflow-hidden ${
                  isChecked
                    ? opt.isAll
                      ? 'bg-amber-500/15 border-amber-500/70 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-400/50'
                      : 'bg-sky-500/15 border-sky-500/70 text-sky-900 dark:text-sky-200 shadow-xs ring-1 ring-sky-400/50'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-sky-300 dark:hover:border-slate-600 opacity-80 hover:opacity-100'
                }`}
              >
                {/* 勾選圖示指示器 */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isChecked
                          ? opt.isAll
                            ? 'text-amber-500'
                            : 'text-sky-500'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{opt.label}</span>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      isChecked
                        ? opt.isAll
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'bg-sky-500 border-sky-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] mt-0.5">
                  <span className="text-slate-400 dark:text-slate-500 leading-tight">
                    {opt.desc}
                  </span>
                  <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900/60 text-slate-400 font-bold shrink-0 ml-1">
                    {opt.pathDesc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 當前選取摘要提示條 */}
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
          <Layers className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span className="truncate">{selectedCountText}</span>
        </div>
      </div>

      {/* 3. 快速套用維護事由 */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>常用維護事由快捷按鈕</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  reason: r,
                  title: `網站${r}中，請稍後再下單`,
                }))
              }
              className={`text-[11px] px-2.5 py-1 rounded-xl font-bold border transition active:scale-95 cursor-pointer ${
                config.reason === r
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 維護標題 */}
      <div className="space-y-1">
        <label htmlFor="maint-title-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          維護大標題
        </label>
        <input
          id="maint-title-input"
          name="maintTitle"
          type="text"
          value={config.title}
          onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
          className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="例如：網站例行升級中..."
        />
      </div>

      {/* 5. 維護詳細說明 */}
      <div className="space-y-1">
        <label htmlFor="maint-message-textarea" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          維護廣播說明文字
        </label>
        <textarea
          id="maint-message-textarea"
          name="maintMessage"
          rows={3}
          value={config.message}
          onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
          className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="請輸入欲向點餐成員說明的維護原因或注意事項..."
        />
      </div>

      {/* 6. 預計完成時間 */}
      <div className="space-y-1">
        <label htmlFor="maint-time-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
          預計完成時間
        </label>
        <input
          id="maint-time-input"
          name="maintEstimatedTime"
          type="text"
          value={config.estimated_end_time || ''}
          onChange={(e) => setConfig((prev) => ({ ...prev, estimated_end_time: e.target.value }))}
          className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
          placeholder="例如：預計 12:30 恢復點餐 或 預計 15 分鐘完成"
        />
      </div>

      {/* 7. 自訂圖片 / GIF 上傳 */}
      <div className="space-y-1.5 pt-1">
        <label htmlFor="maint-image-file-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-sky-500" />
          <span>自訂維護插圖 / 動態 GIF (選填)</span>
        </label>

        {config.custom_image_url ? (
          <div className="relative inline-block border-2 border-amber-400 dark:border-amber-500 rounded-2xl overflow-hidden shadow-md">
            <img
              src={config.custom_image_url}
              alt="維護自訂圖片"
              className="w-36 h-36 object-contain bg-slate-900"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full shadow-md hover:bg-rose-700 active:scale-95 transition cursor-pointer"
              title="移除自訂圖片"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div>
            <input
              id="maint-image-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-400 active:scale-95 transition shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-sky-500" />
              <span>上傳圖片 / GIF（支援 3MB 內）</span>
            </button>
          </div>
        )}
      </div>

      {/* 8. 儲存設定按鈕 */}
      <div className="pt-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSaveConfig()}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? '正在儲存設定中...' : '儲存維護設定'}</span>
        </button>
      </div>
    </div>
  );
}
