'use client';

import React from 'react';
import {
  Code2,
  CheckCircle2,
  Calculator,
  Layers,
  Terminal,
  Play,
  Sparkles,
} from 'lucide-react';
import type { TelemetryEvent, TelemetryNodeId } from '@/lib/telemetry/telemetryHub';
import { telemetryHub } from '@/lib/telemetry/telemetryHub';

interface LogicInspectorDrawerProps {
  selectedEvent: TelemetryEvent | null;
  activeNode: TelemetryNodeId | null;
}

export function LogicInspectorDrawer({
  selectedEvent,
  activeNode,
}: LogicInspectorDrawerProps) {
  return (
    <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-5">
      {/* 標題與操作控制列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>運作邏輯逐步解讀儀</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                {activeNode ? `NODE: ${activeNode.toUpperCase()}` : 'LOGIC ENGINE'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              圖解當前功能背後之執行步驟、演算法公式與狀態轉換
            </p>
          </div>
        </div>

        {/* 模擬即時觸發按鈕群 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => telemetryHub.simulateOrderFlow()}
            className="text-xs font-black px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white transition active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>模擬點餐流</span>
          </button>

          <button
            type="button"
            onClick={() => telemetryHub.simulateFeeSplit()}
            className="text-xs font-black px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>模擬平攤演算法</span>
          </button>
        </div>
      </div>

      {selectedEvent ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 當前選取之事件概覽 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {selectedEvent.action}
              </span>
              <span className="text-[11px] font-mono text-slate-400">{selectedEvent.timestamp}</span>
            </div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
              {selectedEvent.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {selectedEvent.detail}
            </p>
          </div>

          {/* 🧮 運作邏輯公式分解 (若有) */}
          {selectedEvent.formula && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-black">
                <Calculator className="w-4 h-4" />
                <span>演算法推導公式 (Mathematical Formula)</span>
              </div>
              <div className="font-mono text-xs p-3 rounded-xl bg-white/90 dark:bg-[#0B101D] text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/60 font-bold overflow-x-auto">
                {selectedEvent.formula}
              </div>
            </div>
          )}

          {/* 🪜 運作邏輯步驟流水線 (Logic Steps Pipeline) */}
          {selectedEvent.logicSteps && selectedEvent.logicSteps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>執行步驟拆解 (Execution Pipeline)</span>
              </div>

              <div className="space-y-2.5">
                {selectedEvent.logicSteps.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#131B2B] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition hover:border-purple-300 dark:hover:border-purple-800"
                  >
                    <div className="w-6 h-6 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {step.title}
                        </h5>
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>已完成</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📦 輸入參數快照 (Payload Inspector) */}
          {selectedEvent.payload && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
                <Terminal className="w-4 h-4 text-sky-500" />
                <span>資料快照 (Payload Snapshot)</span>
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* 預設引導畫面 */
        <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-[#131B2B]/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-200">
            請點選左側事件或下方終端機記錄
          </h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
            系統將自動即時為您拆解該操作之運作邏輯步驟、演算法公式與執行期快照。
          </p>
        </div>
      )}
    </div>
  );
}
