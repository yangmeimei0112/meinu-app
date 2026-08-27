'use client';

import React from 'react';
import { Volume2, X, CheckCircle2, Circle, FileText, Zap, Sliders } from 'lucide-react';

interface AdminVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => boolean;
  speechMode: 'full' | 'summary';
  setSpeechMode: (mode: 'full' | 'summary') => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  playTestSpeech: () => void;
}

export default function AdminVoiceSettingsModal({
  isOpen,
  onClose,
  isSpeechEnabled,
  toggleSpeech,
  speechMode,
  setSpeechMode,
  speechRate,
  setSpeechRate,
  playTestSpeech,
}: AdminVoiceSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
              新訂單語音播報設定
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center font-bold bg-slate-100 dark:bg-slate-800 cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 語音開關 */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-[#152033] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">新訂單語音自動報單</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
              收到新訂單時自動以臺灣國語朗讀內容
            </p>
          </div>
          <button
            type="button"
            onClick={toggleSpeech}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              isSpeechEnabled
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isSpeechEnabled ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>已開啟</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Circle className="w-3.5 h-3.5 text-slate-400" />
                <span>已關閉</span>
              </span>
            )}
          </button>
        </div>

        {/* 播報內容詳細度 */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
            播報詳細度模式
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSpeechMode('full')}
              className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                speechMode === 'full'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="font-black text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>完整明細模式 (推薦)</span>
              </p>
              <p className="text-[10px] mt-1 opacity-80 leading-relaxed">
                報出姓名、餐點品項、數量與客製備註
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSpeechMode('summary')}
              className={`p-3 rounded-2xl text-left border transition cursor-pointer ${
                speechMode === 'summary'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="font-black text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>簡明摘要模式</span>
              </p>
              <p className="text-[10px] mt-1 opacity-80 leading-relaxed">
                僅報出姓名、總份數與總金額
              </p>
            </button>
          </div>
        </div>

        {/* 語速調整橫式控制桿 (0.5x ~ 2.0x，間隔 0.1) */}
        <div className="space-y-3 bg-slate-50 dark:bg-[#152033] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between">
            <label
              htmlFor="voice-speed-slider"
              className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-500" />
              <span>播報語速調節</span>
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                {speechRate.toFixed(1)}x
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {speechRate <= 0.7
                  ? '慢速清晰'
                  : speechRate <= 1.2
                  ? '標準自然'
                  : speechRate <= 1.6
                  ? '俐落快速'
                  : '極速報單'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <input
              id="voice-speed-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition shadow-inner"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold px-0.5">
              <span>0.5x (慢速)</span>
              <span>1.0x (原速)</span>
              <span>1.5x (快速)</span>
              <span>2.0x (極速)</span>
            </div>
          </div>
        </div>

        {/* 試聽與確認完成 */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <button
            type="button"
            onClick={playTestSpeech}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs py-2.5 rounded-2xl transition active:scale-95 flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>立即試聽效果</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-2.5 rounded-2xl transition active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer text-center"
          >
            確認完成
          </button>
        </div>
      </div>
    </div>
  );
}
