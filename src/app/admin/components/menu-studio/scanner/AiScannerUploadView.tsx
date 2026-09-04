'use client';

import React from 'react';
import { Camera, Upload, AlertTriangle, ChevronDown } from 'lucide-react';
import { AiScannerQuickPresets } from './AiScannerQuickPresets';

interface AiScannerUploadViewProps {
  errorMessage: string | null;
  debugTrace: string[];
  showTrace: boolean;
  setShowTrace: (show: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadMockData: (type: 'beverage' | 'bento') => void;
}

export function AiScannerUploadView({
  errorMessage,
  debugTrace,
  showTrace,
  setShowTrace,
  fileInputRef,
  cameraInputRef,
  onFileInputChange,
  onLoadMockData,
}: AiScannerUploadViewProps) {
  return (
    <div className="space-y-6 text-center py-4">
      {/* 隱藏的 File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={onFileInputChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* 錯誤提示 */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {debugTrace.length > 0 && (
            <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40">
              <button
                type="button"
                onClick={() => setShowTrace(!showTrace)}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{showTrace ? '隱藏技術偵錯日誌' : '查看技術偵錯日誌'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showTrace ? 'rotate-180' : ''}`} />
              </button>
              {showTrace && (
                <pre className="mt-2 text-[10px] bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-32 font-mono whitespace-pre-wrap">
                  {debugTrace.join('\n')}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* 拍照與檔案上傳兩大操作卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="group relative overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 shadow-lg shadow-sky-500/25 active:scale-98 transition cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-base font-extrabold tracking-wide">直接開啟相機拍照</h4>
            <p className="text-xs text-sky-100 mt-1 font-medium">適合在實體店家直接拍攝紙本菜單</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative overflow-hidden bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 active:scale-98 transition cursor-pointer"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center group-hover:scale-110 transition text-slate-700 dark:text-slate-200">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">選取照片或菜單圖片</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">支援 JPG、PNG、WebP，最大 15MB</p>
          </div>
        </button>
      </div>

      {/* 快速示範範本區 */}
      <AiScannerQuickPresets onLoadMockData={onLoadMockData} />
    </div>
  );
}
