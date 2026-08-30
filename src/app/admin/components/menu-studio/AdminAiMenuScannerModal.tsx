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
  XCircle,
  Activity,
  Coffee,
  UtensilsCrossed,
  ShieldCheck,
  Zap,
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

// 🥤 示範用手搖飲料菜單範本
const MOCK_BEVERAGE_ITEMS: RecognizedItem[] = [
  {
    tempId: 'mock_1',
    name: '珍珠奶茶',
    price: 50,
    description: '經典慢火熬煮黑糖波霸搭配香醇奶茶',
    category: '招牌特調',
    is_sold_out: false,
    selected: true,
    custom_groups: [
      {
        id: 'cg_sweet_1',
        title: '甜度選擇',
        type: 'single',
        options: [
          { id: 'opt_s1', name: '正常甜 (100%)', price: 0 },
          { id: 'opt_s2', name: '少糖 (70%)', price: 0 },
          { id: 'opt_s3', name: '半糖 (50%)', price: 0 },
          { id: 'opt_s4', name: '微糖 (30%)', price: 0, is_default: true },
          { id: 'opt_s5', name: '無糖 (0%)', price: 0 },
        ],
      },
      {
        id: 'cg_ice_1',
        title: '冰塊選擇',
        type: 'single',
        options: [
          { id: 'opt_i1', name: '正常冰', price: 0 },
          { id: 'opt_i2', name: '少冰', price: 0, is_default: true },
          { id: 'opt_i3', name: '微冰', price: 0 },
          { id: 'opt_i4', name: '去冰', price: 0 },
        ],
      },
      {
        id: 'cg_add_1',
        title: '加料專區',
        type: 'multiple',
        options: [
          { id: 'opt_a1', name: '黑糖波霸', price: 10 },
          { id: 'opt_a2', name: '椰果', price: 10 },
          { id: 'opt_a3', name: '仙草凍', price: 10 },
        ],
      },
    ],
  },
  {
    tempId: 'mock_2',
    name: '四季春茶',
    price: 35,
    description: '嚴選南投高山四季春，茶韻甘醇不澀口',
    category: '原葉純茶',
    is_sold_out: false,
    selected: true,
    custom_groups: [
      {
        id: 'cg_sweet_2',
        title: '甜度選擇',
        type: 'single',
        options: [
          { id: 'opt_s21', name: '微糖 (30%)', price: 0, is_default: true },
          { id: 'opt_s22', name: '無糖 (0%)', price: 0 },
        ],
      },
      {
        id: 'cg_ice_2',
        title: '冰塊選擇',
        type: 'single',
        options: [
          { id: 'opt_i21', name: '少冰', price: 0, is_default: true },
          { id: 'opt_i22', name: '去冰', price: 0 },
        ],
      },
    ],
  },
  {
    tempId: 'mock_3',
    name: '紅茶拿鐵 (鮮奶茶)',
    price: 60,
    description: '斯里蘭卡莊園紅茶與濃醇鮮乳黃金比例',
    category: '鮮奶拿鐵',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
  {
    tempId: 'mock_4',
    name: '鮮橙翡翠綠',
    price: 65,
    description: '新鮮柳橙鮮榨原汁與清香翡翠綠茶',
    category: '鮮果鮮茶',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
];

// 🍱 示範用便當快餐菜單範本
const MOCK_BENTO_ITEMS: RecognizedItem[] = [
  {
    tempId: 'mock_b1',
    name: '招牌酥炸排骨便當',
    price: 110,
    description: '現炸厚切秘製排骨，附三樣當季配菜與滷蛋',
    category: '人氣便當',
    is_sold_out: false,
    selected: true,
    custom_groups: [
      {
        id: 'cg_rice_1',
        title: '飯量選擇',
        type: 'single',
        options: [
          { id: 'opt_r1', name: '正常飯量', price: 0, is_default: true },
          { id: 'opt_r2', name: '大份加飯', price: 10 },
          { id: 'opt_r3', name: '少飯 (減醣)', price: 0 },
        ],
      },
      {
        id: 'cg_side_1',
        title: '附餐升級',
        type: 'single',
        options: [
          { id: 'opt_sd1', name: '當日例湯', price: 0, is_default: true },
          { id: 'opt_sd2', name: '冰檸檬紅茶', price: 15 },
        ],
      },
    ],
  },
  {
    tempId: 'mock_b2',
    name: '經典香酥大雞腿飯',
    price: 125,
    description: '黃金酥脆超大份量鮮嫩雞腿，皮脆多汁',
    category: '人氣便當',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
  {
    tempId: 'mock_b3',
    name: '泰式椒麻雞便當',
    price: 120,
    description: '特調酸辣椒麻醬汁，去骨雞腿酥脆可口',
    category: '特色主廚',
    is_sold_out: false,
    selected: true,
    custom_groups: [],
  },
];

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
        throw new Error(`自主診斷探針異常 (${res.status}): ${rawText.slice(0, 100)}`);
      }

      if (json.diagnostic) {
        setDiagResult(json.diagnostic);
      } else {
        setDiagResult({
          healthy: false,
          message: json.message || '診斷未能取得詳細指標',
        });
      }
    } catch (e: any) {
      setDiagResult({
        healthy: false,
        message: e.message || '執行自主偵錯時發生錯誤',
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  // 處理圖片檔案上傳與 AI 解析
  const handleProcessImageFile = async (file: File) => {
    try {
      setErrorMessage(null);
      setDebugTrace([]);
      setShowTrace(false);
      setCurrentStep('processing');
      setProcessStage(1);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 1. 本地 Canvas 智慧壓縮 (2400px 超清畫質)
      const compressed = await compressMenuImage(file, 2400, 0.90);

      // 2. 模擬多階段視覺反饋
      setProcessStage(2);
      stageTimerRef.current = setTimeout(() => {
        setProcessStage(3);
      }, 1500);

      // 3. 發送至後端 API
      const res = await fetch('/api/admin/menu/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
          storeName,
          customApiKey: customApiKey.trim() || undefined,
        }),
      });

      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);

      // 🛡️ 安全解析 JSON 回應
      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(
          `伺服端回應非預期格式 (${res.status})，請確認網路連線或稍後再試。原始回傳：${rawText.slice(0, 100)}`
        );
      }

      if (json.debugTrace && Array.isArray(json.debugTrace)) {
        setDebugTrace(json.debugTrace);
      }

      if (!json.success) {
        if (json.needsApiKey) {
          setShowKeyDrawer(true);
        }
        throw new Error(json.message || 'AI 菜單解析失敗');
      }

      if (!json.items || json.items.length === 0) {
        throw new Error('未能識別出有效的菜單品項，請嘗試更換較清晰的照片');
      }

      setRecognizedItems(json.items);
      setCurrentStep('review');
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message?.includes('aborted') || e.message?.includes('中斷')) {
        console.log('使用者已手動取消 AI 菜單掃描');
        setCurrentStep('upload');
        return;
      }
      console.error('AI 辨識失敗:', e);
      setErrorMessage(e.message || '處理圖片時發生錯誤');
      setCurrentStep('upload');
    } finally {
      abortControllerRef.current = null;
    }
  };

  // 手動取消當前 AI 掃描
  const handleCancelScan = () => {
    if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    handleReset();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  // 重置回上傳步驟
  const handleReset = () => {
    if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setCurrentStep('upload');
    setRecognizedItems([]);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // 🧰 載入模擬示範資料
  const handleLoadMockData = (type: 'beverage' | 'bento') => {
    const items = type === 'beverage' ? MOCK_BEVERAGE_ITEMS : MOCK_BENTO_ITEMS;
    setRecognizedItems(items);
    setErrorMessage(null);
    setCurrentStep('review');
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
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>模擬測試與示範載入（免拍菜單立即試用）：</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleLoadMockData('beverage')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Coffee className="w-3.5 h-3.5 text-sky-500" />
                    <span>載入手搖飲料示範菜單 (50嵐/得正)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadMockData('bento')}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                    <span>載入便當快餐示範菜單 (排骨/雞腿便當)</span>
                  </button>
                </div>
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

              {/* 🛑 取消掃描按鍵 */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCancelScan}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/90 dark:hover:bg-rose-950/40 px-4 py-2 rounded-xl transition border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 shadow-2xs active:scale-95 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                  <span>取消當前掃描</span>
                </button>
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
