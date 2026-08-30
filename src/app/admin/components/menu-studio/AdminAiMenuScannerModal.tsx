'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Key,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { compressMenuImage } from '@/lib/imageCompressor';
import { AdminAiMenuReviewTable, RecognizedItem } from './AdminAiMenuReviewTable';

interface AdminAiMenuScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  onImportSuccess: (count: number) => void;
}

type ScanStep = 'upload' | 'processing' | 'review';

const LOCAL_STORAGE_KEY_API_KEY = 'meinu_custom_gemini_api_key';

export default function AdminAiMenuScannerModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  onImportSuccess,
}: AdminAiMenuScannerModalProps) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('upload');
  const [processStage, setProcessStage] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI 識別出的品項清單
  const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);

  // 自訂 API Key 設定
  const [showKeyDrawer, setShowKeyDrawer] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 讀取本地儲存之自訂 API Key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY_API_KEY);
      if (savedKey) {
        setCustomApiKey(savedKey);
      }
    }
  }, []);

  if (!isOpen) return null;

  // 儲存 API Key 至本地
  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      const cleanKey = customApiKey.trim();
      if (cleanKey) {
        localStorage.setItem(LOCAL_STORAGE_KEY_API_KEY, cleanKey);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_API_KEY);
      }
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 2500);
      setShowKeyDrawer(false);
    }
  };

  // 處理圖片檔案上傳與 AI 解析
  const handleProcessImageFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setCurrentStep('processing');
      setProcessStage(1);

      // 1. 本地 Canvas 智慧壓縮
      const compressed = await compressMenuImage(file, 1600, 0.85);

      // 2. 模擬多階段視覺反饋
      setProcessStage(2);
      const stageTimer = setTimeout(() => {
        setProcessStage(3);
      }, 1500);

      // 3. 發送至後端 API
      const res = await fetch('/api/admin/menu/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
          storeName,
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      clearTimeout(stageTimer);
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (json.needsApiKey) {
          setShowKeyDrawer(true);
        }
        throw new Error(json.message || 'AI 解析菜單失敗');
      }

      if (!json.items || json.items.length === 0) {
        throw new Error('未能識別出有效的菜單品項，請嘗試更換較清晰的照片');
      }

      setRecognizedItems(json.items);
      setCurrentStep('review');
    } catch (e: any) {
      console.error('AI 辨識失敗:', e);
      setErrorMessage(e.message || '處理圖片時發生錯誤');
      setCurrentStep('upload');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  // 重置回上傳步驟
  const handleReset = () => {
    setCurrentStep('upload');
    setRecognizedItems([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E1524] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 頂部 Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>AI 拍照智能匯入菜單</span>
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  Gemini Flash Vision
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                目標店家：<span className="text-sky-600 dark:text-sky-400 font-bold">{storeName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowKeyDrawer(!showKeyDrawer)}
              className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                showKeyDrawer
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800'
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

        {/* 🔑 API Key 自訂設定收合抽屜 */}
        {showKeyDrawer && (
          <div className="bg-slate-50 dark:bg-slate-900/90 p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-500" />
                  <span>設定 Google Gemini API Key（免費額度可用）</span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  若伺服端未設定環境變數，您可在此直接貼上金鑰，將安全保存在本機瀏覽器中。
                </p>
              </div>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>30秒免費取得</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="貼上您的 Gemini API Key (AIzaSy...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
              >
                儲存金鑰
              </button>
            </div>
            {keySavedToast && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>金鑰已成功儲存於瀏覽器！</span>
              </span>
            )}
          </div>
        )}

        {/* 彈窗內容主體 */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 錯誤提示 */}
          {errorMessage && currentStep === 'upload' && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: 拍照 / 上傳入口 */}
          {currentStep === 'upload' && (
            <div className="space-y-5">
              {/* 隱藏的原生 Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* 雙按鈕上傳區 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 手機直接拍照 */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="group p-6 rounded-3xl border-2 border-dashed border-sky-300 dark:border-sky-700/80 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/50 dark:hover:bg-sky-900/30 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer active:scale-98"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-110 transition-transform">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      📸 手機直接拍照
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      直接開啟手機相機對準實體紙本菜單拍攝
                    </p>
                  </div>
                </button>

                {/* 相簿選圖 / 拖曳圖片 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-6 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition flex flex-col items-center justify-center text-center space-y-3 cursor-pointer active:scale-98"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      📁 從相簿選取 / 拖曳圖檔
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      支援 JPG、PNG、WebP 等多種菜單圖檔格式
                    </p>
                  </div>
                </button>
              </div>

              {/* 拍攝小提示 */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-4 rounded-2xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>拍攝與辨識高準確率秘訣：</span>
                </div>
                <ul className="list-disc list-inside text-[11px] opacity-85 space-y-0.5 leading-relaxed pl-1">
                  <li>保持充足光線，盡量避免頭頂燈光造成強烈反光與陰影。</li>
                  <li>相機鏡頭與菜單保持垂直平行，讓文字更平整清晰。</li>
                  <li>若菜單很大（如整張長條傳單），可分區多次拍攝或近距離特寫拍攝。</li>
                  <li>支援辨識手搖飲甜度/冰塊、便當飯量/配菜與加料加價項目。</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: AI 解析中進度動畫 */}
          {currentStep === 'processing' && (
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
            </div>
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
