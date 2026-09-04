'use client';

import { useState, useRef, useEffect } from 'react';
import { RecognizedItem } from '../AdminAiMenuReviewTable';
import { compressMenuImage } from '@/lib/imageCompressor';
import { MOCK_BEVERAGE_ITEMS, MOCK_BENTO_ITEMS } from '../mockMenuPresets';
import { formatErrorMessage } from '@/lib/errorUtils';

export type ScanStep = 'upload' | 'processing' | 'review';

const LOCAL_STORAGE_KEY_API_KEY = 'meinu_custom_gemini_api_key';

interface UseAiScannerStateProps {
  storeId: string;
}

export function useAiScannerState({ storeId }: UseAiScannerStateProps) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('upload');
  const [processStage, setProcessStage] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);

  // 自訂 API Key 設定
  const [showKeyDrawer, setShowKeyDrawer] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  // 自主偵錯狀態
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [debugTrace] = useState<string[]>([]);
  const [showTrace, setShowTrace] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY_API_KEY);
      if (savedKey) {
        setCustomApiKey(savedKey);
      }
    }
  }, []);

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
        message: `偵錯請求連線失敗: ${formatErrorMessage(e, '網路連線異常')}`,
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleLoadMockData = (type: 'beverage' | 'bento') => {
    const mockData = type === 'beverage' ? MOCK_BEVERAGE_ITEMS : MOCK_BENTO_ITEMS;
    setRecognizedItems(JSON.parse(JSON.stringify(mockData)));
    setCurrentStep('review');
    setErrorMessage(null);
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (stageTimerRef.current) {
      clearInterval(stageTimerRef.current);
    }
    setCurrentStep('upload');
    setErrorMessage(null);
  };

  const handleProcessImage = async (file: File) => {
    setCurrentStep('processing');
    setProcessStage(1);
    setErrorMessage(null);

    stageTimerRef.current = setInterval(() => {
      setProcessStage((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 2800);

    try {
      const compressedBase64 = await compressMenuImage(file);
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/admin/menu/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedBase64,
          storeId,
          customApiKey: customApiKey.trim() || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current);
      }

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'AI 辨識發生錯誤');
      }

      const items: RecognizedItem[] = (result.items || []).map((item: any) => ({
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: item.name || '',
        price: Number(item.price) || 0,
        category: item.category || '一般餐點',
        description: item.description || '',
        customGroups: item.customGroups || [],
        confidence: item.confidence || 'high',
        selected: true,
      }));

      if (items.length === 0) {
        throw new Error('未能在此圖片中識別出任何菜單項目，請嘗試更清晰或光線更充足的照片。');
      }

      setRecognizedItems(items);
      setCurrentStep('review');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('AI 辨識失敗:', err);
      setErrorMessage(formatErrorMessage(err, '圖片分析失敗，請稍後再試'));
      setCurrentStep('upload');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImage(file);
    }
    e.target.value = '';
  };

  return {
    currentStep,
    setCurrentStep,
    processStage,
    errorMessage,
    setErrorMessage,
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
  };
}
