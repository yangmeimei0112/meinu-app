'use client';

import React from 'react';
import { Sparkles, X, Key, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { AdminAiMenuReviewTable } from './AdminAiMenuReviewTable';
import { AiScannerApiKeyDrawer } from './scanner/AiScannerApiKeyDrawer';
import { AiScannerProcessingStage } from './scanner/AiScannerProcessingStage';
import { AiScannerUploadView } from './scanner/AiScannerUploadView';
import { useAiScannerState } from './scanner/useAiScannerState';

interface AdminAiMenuScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  onImportSuccess: (count: number) => void;
}

export default function AdminAiMenuScannerModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  onImportSuccess,
}: AdminAiMenuScannerModalProps) {
  const {
    currentStep,
    setCurrentStep,
    processStage,
    errorMessage,
    recognizedItems,
    setRecognizedItems,
    showKeyDrawer,
    setShowKeyDrawer,
    customApiKey,
    setCustomApiKey,
    keySavedToast,
    isDiagnosing,
    diagResult,
    setDiagResult,
    debugTrace,
    showTrace,
    setShowTrace,
    fileInputRef,
    cameraInputRef,
    handleSaveApiKey,
    handleRunDiagnostics,
    handleLoadMockData,
    handleCancelScan,
    handleFileSelected,
  } = useAiScannerState({ storeId });

  if (!isOpen) return null;

  const handleReset = () => {
    setCurrentStep('upload');
    setRecognizedItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* 頂部標題區 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>AI 智慧菜單拍攝辨識</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
                  Gemini Vision 2.5
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                店家：<span className="font-bold text-slate-700 dark:text-slate-200">{storeName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 自主偵錯探針按鈕 */}
            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={isDiagnosing}
              className="p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              title="執行 AI 連線與金鑰自主健康檢查"
            >
              <Activity className={`w-4 h-4 text-sky-500 ${isDiagnosing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">自主偵錯</span>
            </button>

            {/* 金鑰設定按鈕 */}
            <button
              type="button"
              onClick={() => setShowKeyDrawer(!showKeyDrawer)}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                showKeyDrawer
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
              title="設定自訂 Google Gemini API Key"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">金鑰設定</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🧪 自主偵錯報告面板 */}
        {diagResult && (
          <div
            className={`p-4 border-b flex items-start justify-between gap-3 text-xs animate-in slide-in-from-top duration-200 ${
              diagResult.healthy
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                {diagResult.healthy ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                )}
                <span>自主診斷報告：{diagResult.message}</span>
                {diagResult.latency && (
                  <span className="font-mono text-[10px] opacity-80">({diagResult.latency}ms)</span>
                )}
              </div>
              {diagResult.supportedModels && diagResult.supportedModels.length > 0 && (
                <p className="text-[11px] opacity-85">
                  可用模型：{diagResult.supportedModels.slice(0, 4).join('、')} 等{' '}
                  {diagResult.supportedModels.length} 款
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDiagResult(null)}
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 🔑 API Key 自訂設定收合抽屜 */}
        <AiScannerApiKeyDrawer
          showKeyDrawer={showKeyDrawer}
          customApiKey={customApiKey}
          setCustomApiKey={setCustomApiKey}
          onSaveApiKey={handleSaveApiKey}
          keySavedToast={keySavedToast}
        />

        {/* 彈窗內容主體 */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: 拍照 / 上傳入口 */}
          {currentStep === 'upload' && (
            <AiScannerUploadView
              errorMessage={errorMessage}
              debugTrace={debugTrace}
              showTrace={showTrace}
              setShowTrace={setShowTrace}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              onFileInputChange={handleFileSelected}
              onLoadMockData={handleLoadMockData}
            />
          )}

          {/* STEP 2: AI 解析中進度動畫 */}
          {currentStep === 'processing' && (
            <AiScannerProcessingStage
              processStage={processStage}
              onCancelScan={handleCancelScan}
            />
          )}

          {/* STEP 3: 人機協同檢驗表格 */}
          {currentStep === 'review' && (
            <AdminAiMenuReviewTable
              storeId={storeId}
              storeName={storeName}
              initialItems={recognizedItems}
              onImportSuccess={(count) => {
                onImportSuccess(count);
                onClose();
              }}
              onCancel={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
