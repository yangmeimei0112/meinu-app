'use client';

import React from 'react';
import { Sparkles, XCircle } from 'lucide-react';

interface AiScannerProcessingStageProps {
  processStage: number;
  onCancelScan: () => void;
}

export function AiScannerProcessingStage({
  processStage,
  onCancelScan,
}: AiScannerProcessingStageProps) {
  return (
    <div className="py-8 text-center space-y-6 animate-in fade-in">
      <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          AI 正在深度閱讀與解析菜單內容...
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {processStage === 1 && '正在進行本地圖片超解析度優化與 EXIF 方向校正...'}
          {processStage === 2 && 'AI 正在分析菜單排版、多欄架構與餐點價格...'}
          {processStage === 3 && '正在提取客製化規格選項（甜度、冰塊、加料加價）...'}
        </p>
      </div>

      {/* 三階段進度徽章 */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <div className={`flex items-center gap-1 text-[11px] font-bold ${processStage >= 1 ? 'text-sky-500' : 'text-slate-400'}`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>1. 圖片最佳化</span>
        </div>
        <div className="w-4 h-px bg-slate-300 dark:bg-slate-700" />
        <div className={`flex items-center gap-1 text-[11px] font-bold ${processStage >= 2 ? 'text-sky-500' : 'text-slate-400'}`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>2. 視覺結構解析</span>
        </div>
        <div className="w-4 h-px bg-slate-300 dark:bg-slate-700" />
        <div className={`flex items-center gap-1 text-[11px] font-bold ${processStage >= 3 ? 'text-sky-500' : 'text-slate-400'}`}>
          <span className="w-2 h-2 rounded-full bg-current" />
          <span>3. 規格生成</span>
        </div>
      </div>

      {/* 🛑 取消掃描按鍵 */}
      <div className="pt-4">
        <button
          type="button"
          onClick={onCancelScan}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/90 dark:hover:bg-rose-950/40 px-4 py-2 rounded-xl transition border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:border-rose-800 shadow-2xs active:scale-95 cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
          <span>取消當前掃描</span>
        </button>
      </div>
    </div>
  );
}
