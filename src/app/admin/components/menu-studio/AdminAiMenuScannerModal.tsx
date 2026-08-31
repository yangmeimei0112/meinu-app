'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Key,
  AlertTriangle,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { compressMenuImage } from '@/lib/imageCompressor';
import { AdminAiMenuReviewTable, RecognizedItem } from './AdminAiMenuReviewTable';
import { MOCK_BEVERAGE_ITEMS, MOCK_BENTO_ITEMS } from './mockMenuPresets';
import { AiScannerApiKeyDrawer } from './scanner/AiScannerApiKeyDrawer';
import { AiScannerProcessingStage } from './scanner/AiScannerProcessingStage';
import { AiScannerQuickPresets } from './scanner/AiScannerQuickPresets';

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

  // 自主偵錯狀態
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [debugTrace, setDebugTrace] = useState<string[]>([]);
  const [showTrace, setShowTrace] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 🧪 執行自主診斷系統
  const handleRunDiagnostics = async () => {
    try {
      setIsDiagnosing(true);
      setDiagResult(null);
      setErrorMessage(null);

      const res = await fetch('/api/admin/menu/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'diagnose',
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        json = { success: false, message: `伺服端回應非 JSON：${rawText.slice(0, 100)}` };
      }

      setDiagResult({
        healthy: json.success && json.diagnosis?.available,
        message: json.message || (json.success ? '連線診斷完畢' : '診斷失敗'),
        latency: json.diagnosis?.latencyMs,
        supportedModels: json.diagnosis?.supportedModels || [],
      });
    } catch (e: any) {
      setDiagResult({
        healthy: false,
        message: `偵錯請求連線失敗: ${e?.message || '網路異常'}`,
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  // 載入示範用範本資料
  const handleLoadMockData = (type: 'beverage' | 'bento') => {
    const mockData = type === 'beverage' ? MOCK_BEVERAGE_ITEMS : MOCK_BENTO_ITEMS;
    setRecognizedItems(JSON.parse(JSON.stringify(mockData)));
    setCurrentStep('review');
    setErrorMessage(null);
  };

  // 取消當前進行中的 AI 掃描
  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    setCurrentStep('upload');
    setProcessStage(1);
  };

  // 核心上傳與壓縮發送邏輯
  const handleProcessImageFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setDebugTrace([]);
      setShowTrace(false);
      setCurrentStep('processing');
      setProcessStage(1);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      stageTimerRef.current = setInterval(() => {
        setProcessStage((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);

      // 1. 本地圖片壓縮
      const compressed = await compressMenuImage(file, 2048, 0.85);

      setProcessStage(2);

      // 2. 發送至後端 Gemini 視覺解析 API
      const res = await fetch('/api/admin/menu/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
          storeName,
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`伺服端回傳非預期格式: ${rawText.slice(0, 100)}...`);
      }

      if (!res.ok || !json.success) {
        if (json.details?.debugLogs) {
          setDebugTrace(json.details.debugLogs);
        }
        throw new Error(json.message || 'AI 辨識過程發生未預期的錯誤');
      }

      const items: RecognizedItem[] = (json.data?.items || []).map(
        (item: any, idx: number) => ({
          tempId: `recognized_${Date.now()}_${idx}`,
          name: item.name || '未命名餐點',
          price: typeof item.price === 'number' ? item.price : 0,
          description: item.description || '',
          category: item.category || '精選推薦',
          is_sold_out: false,
          selected: true,
          custom_groups: (item.custom_groups || []).map((cg: any, cgIdx: number) => ({
            id: `cg_${Date.now()}_${idx}_${cgIdx}`,
            title: cg.title || '規格選項',
            type: cg.type || 'single',
            options: (cg.options || []).map((opt: any, optIdx: number) => ({
              id: `opt_${Date.now()}_${idx}_${cgIdx}_${optIdx}`,
              name: opt.name || '選項',
              price: typeof opt.price === 'number' ? opt.price : 0,
              is_default: !!opt.is_default,
            })),
          })),
        })
      );

      if (items.length === 0) {
        throw new Error('未能在圖片中辨識出任何有效餐點品項，請確認拍攝角度或清晰度。');
      }

      setRecognizedItems(items);
      setCurrentStep('review');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      setCurrentStep('upload');
      setErrorMessage(err.message || '辨識失敗，請檢查網路連線或更換圖片重試。');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setRecognizedItems([]);
    setErrorMessage(null);
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
          {/* 錯誤提示 */}
          {errorMessage && currentStep === 'upload' && (
            <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="whitespace-pre-line leading-relaxed">{errorMessage}</span>
              </div>

              {/* 詳細診斷日誌展開 */}
              {debugTrace && debugTrace.length > 0 && (
                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/60">
                  <button
                    type="button"
                    onClick={() => setShowTrace(!showTrace)}
                    className="text-[11px] font-bold text-rose-800 dark:text-rose-200 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showTrace ? '收合詳細診斷歷程' : '🔍 查看詳細嘗試歷程與 Google 回應'}</span>
                  </button>
                  {showTrace && (
                    <div className="mt-2 p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-emerald-400 space-y-1 max-h-48 overflow-y-auto select-text border border-slate-700">
                      {debugTrace.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60 dark:border-rose-800/60 text-[11px]">
                <span>💡 建議動作：</span>
                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  className="text-sky-600 dark:text-sky-400 underline font-extrabold cursor-pointer"
                >
                  執行自主偵錯檢查連線
                </button>
                <span>或點選下方載入範本測試</span>
              </div>
            </div>
          )}

          {/* STEP 1: 拍照 / 上傳入口 */}
          {currentStep === 'upload' && (
            <div className="space-y-5">
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

              {/* ✨ 模擬測試與範本快速載入區 */}
              <AiScannerQuickPresets onLoadMockData={handleLoadMockData} />

              {/* 拍攝小提示 */}
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-4 rounded-2xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>拍攝與辨識高準確率秘訣：</span>
                </div>
                <ul className="list-disc list-inside text-[11px] opacity-85 space-y-0.5 leading-relaxed pl-1">
                  <li>保持充足光線，盡量避免頭頂燈光造成強烈反光與陰影。</li>
                  <li>相機鏡頭與菜單保持垂直平行，讓文字更平整清晰。</li>
                  <li>支援辨識手搖飲甜度/冰塊、便當飯量/配菜與加料加價項目。</li>
                </ul>
              </div>
            </div>
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
