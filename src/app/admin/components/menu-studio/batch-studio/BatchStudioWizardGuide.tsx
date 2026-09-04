'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';

const STORAGE_KEY = 'menu_app_batch_wizard_enabled';

export function BatchStudioWizardGuide() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsEnabled(saved === 'true');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleEnable = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-end px-1">
        <button
          type="button"
          onClick={handleToggleEnable}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800 transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>開啟步驟引導小精靈 🧙‍♂️</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-purple-500/10 border border-sky-200/80 dark:border-sky-800/60 p-3.5 space-y-2.5 text-xs text-slate-800 dark:text-slate-100 animate-in fade-in duration-150">
      {/* 標題與小精靈開關列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
            🧙‍♂️
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-slate-100">
              批量上架引導小精靈
            </span>
            <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              新手速成
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? '展開小精靈' : '收合小精靈'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleToggleEnable}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title="關閉小精靈（可隨時重新開啟）"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">隱藏小精靈</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          {/* Step 1 */}
          <div className="bg-white/80 dark:bg-[#131B2B]/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-sky-600 dark:text-sky-400">
              <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] flex items-center justify-center font-mono">
                1
              </span>
              <span>選擇輸入方式</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              點擊「貼上文字解析」可直接將整份菜單文字貼入，由系統智慧辨識品名與金額！
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white/80 dark:bg-[#131B2B]/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-indigo-600 dark:text-indigo-400">
              <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-mono">
                2
              </span>
              <span>鍵盤極速快打</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              在網格中按下 <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px]">Enter</kbd> 立即換行新增下一筆，按 <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-[10px]">Tab</kbd> 跳格。
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white/80 dark:bg-[#131B2B]/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-mono">
                3
              </span>
              <span>批量套用常用客製</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              勾選多個品項，點擊頂部「📚 批量套用範本」，一鍵將甜度冰塊或配料同時賦予多道餐點！
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white/80 dark:bg-[#131B2B]/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-mono">
                4
              </span>
              <span>一鍵批量上架</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              系統將自動防呆檢查品名與價格，點擊右下方「🚀 批量上架」直接寫入資料庫完成上架！
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
