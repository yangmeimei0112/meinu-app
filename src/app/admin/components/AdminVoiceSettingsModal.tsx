'use client';

import React from 'react';
import {
  Volume2,
  X,
  CheckCircle2,
  Circle,
  FileText,
  Zap,
  Sliders,
  BellRing,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface AdminVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => boolean;
  isCancelSpeechEnabled?: boolean;
  toggleCancelSpeech?: () => boolean;
  isCancelModalEnabled?: boolean;
  toggleCancelModal?: () => boolean;
  speechMode: 'full' | 'summary';
  setSpeechMode: (mode: 'full' | 'summary') => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  playTestSpeech: () => void;
  playTestCancelSpeech?: () => void;
}

export default function AdminVoiceSettingsModal({
  isOpen,
  onClose,
  isSpeechEnabled,
  toggleSpeech,
  isCancelSpeechEnabled = true,
  toggleCancelSpeech,
  isCancelModalEnabled = true,
  toggleCancelModal,
  speechMode,
  setSpeechMode,
  speechRate,
  setSpeechRate,
  playTestSpeech,
  playTestCancelSpeech,
}: AdminVoiceSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-settings-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* 頂部標題 */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="voice-settings-modal-title"
                className="font-black text-slate-900 dark:text-slate-100 text-base"
              >
                語音播報與通知設定
              </h3>
              <p className="text-[11px] text-slate-400">自訂新單與取消訂單之智慧通知偏好</p>
            </div>
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

        {/* ⚙️ 核心通知開關群組 */}
        <div className="space-y-2.5">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
            即時通知與播報功能開關
          </label>

          {/* 1. 新訂單語音開關 */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#152033] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>新訂單語音自動報單</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                收到新訂單時自動以臺灣國語朗讀內容
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSpeech}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
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

          {/* 2. 訂單取消語音開關 */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#152033] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>訂單取消語音提醒</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                顧客於前台取消或修改退單時語音播報提醒
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCancelSpeech}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                isCancelSpeechEnabled
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {isCancelSpeechEnabled ? (
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

          {/* 3. 訂單取消彈窗通知開關 */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-[#152033] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="space-y-0.5">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-rose-500" />
                <span>訂單取消彈窗即時通知</span>
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                顧客取消訂單時，於畫面中央跳出浮層視窗
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCancelModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                isCancelModalEnabled
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {isCancelModalEnabled ? (
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
                <span>完整明細模式</span>
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
        <div className="space-y-2.5 bg-slate-50 dark:bg-[#152033] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
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

          <div className="space-y-1">
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

        {/* 試聽操作區塊 */}
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">
            語音效果即時試聽
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={playTestSpeech}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs py-2 px-3 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              <span>試聽新訂單語音</span>
            </button>
            <button
              type="button"
              onClick={playTestCancelSpeech}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs py-2 px-3 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>試聽取消訂單語音</span>
            </button>
          </div>
        </div>

        {/* 底部確認完成按鈕 */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs py-2.5 rounded-2xl transition active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer text-center"
          >
            確認完成
          </button>
        </div>
      </div>
    </div>
  );
}

