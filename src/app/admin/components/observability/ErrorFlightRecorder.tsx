'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bug,
  Trash2,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Radio,
} from 'lucide-react';
import type { TelemetryErrorRecord, TelemetryEvent } from '@/lib/telemetry/telemetryHub';
import { telemetryHub } from '@/lib/telemetry/telemetryHub';

interface ErrorFlightRecorderProps {
  errors: TelemetryErrorRecord[];
  events: TelemetryEvent[];
  onSelectEvent: (event: TelemetryEvent) => void;
  selectedEventId: string | null;
}

export function ErrorFlightRecorder({
  errors,
  events,
  onSelectEvent,
  selectedEventId,
}: ErrorFlightRecorderProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'errors'>('events');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('已複製錯誤診斷資訊');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const report = {
      title: '咩nu 平台即時運行與故障診斷報告',
      exportedAt: new Date().toISOString(),
      summary: {
        totalEvents: events.length,
        totalErrors: errors.length,
      },
      errors,
      recentEvents: events.slice(0, 30),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `meinu_telemetry_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('已匯出診斷日誌 JSON 檔');
  };

  return (
    <div className="bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-4">
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMsg}
        </div>
      )}

      {/* 終端機頂部導覽 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {/* 事件串流 vs 異常黑盒子切換頁籤 */}
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'events'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>全域事件串流 ({events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'errors'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>故障黑盒子 ({errors.length})</span>
          </button>
        </div>

        {/* 快捷操作按鈕 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => telemetryHub.simulateMockError()}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>模擬異常</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出報告</span>
          </button>

          <button
            type="button"
            onClick={() => telemetryHub.clearAll()}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空</span>
          </button>
        </div>
      </div>

      {/* 📜 內容清單 */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {activeTab === 'events' ? (
          events.length > 0 ? (
            events.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              const statusColor =
                evt.status === 'success'
                  ? 'text-emerald-500 bg-emerald-500/10'
                  : evt.status === 'error'
                  ? 'text-rose-500 bg-rose-500/10'
                  : 'text-sky-500 bg-sky-500/10';

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-50/80 dark:bg-[#1E293B] border-sky-500 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-[#161F30]/60 border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg mt-0.5 shrink-0 ${statusColor}`}>
                      {evt.node.toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {evt.title}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">({evt.action})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {evt.detail}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">
                    {evt.timestamp}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">尚無即時事件紀錄</div>
          )
        ) : errors.length > 0 ? (
          errors.map((err) => {
            const isExpanded = expandedErrorId === err.id;

            return (
              <div
                key={err.id}
                className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white">
                        {err.category}
                      </span>
                      <h5 className="text-xs font-black text-rose-900 dark:text-rose-200 mt-1">
                        {err.action}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-rose-400">{err.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#0E1524] text-rose-700 dark:text-rose-300 font-mono text-xs border border-rose-100 dark:border-rose-900/30">
                  {err.message}
                </div>

                {/* 💡 AI 智慧診斷修復建議 */}
                {err.aiSuggestion && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] border border-amber-200/80 dark:border-amber-900/40">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black">智慧修復建議：</span>
                      <span>{err.aiSuggestion}</span>
                    </div>
                  </div>
                )}

                {/* 展開之錯誤堆疊 (StackTrace) */}
                {isExpanded && err.stack && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>呼叫堆疊 (Call Stack):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(err.stack || '', err.id)}
                        className="text-sky-500 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        {copiedId === err.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>複製堆疊</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto leading-relaxed max-h-40">
                      {err.stack}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
            🎉 目前全站運作良好，0 異常報錯記錄！
          </div>
        )}
      </div>
    </div>
  );
}
