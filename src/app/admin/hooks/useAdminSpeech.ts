'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechOrderItem {
  name: string;
  quantity: number;
  notes?: string | null;
}

export interface SpeechOrderPayload {
  orderId?: string;
  nickname: string;
  total_amount: number;
  items: SpeechOrderItem[];
}

export type SpeechMode = 'full' | 'summary';

const STORAGE_KEY_ENABLED = 'menu_app_admin_speech_enabled';
const STORAGE_KEY_MODE = 'menu_app_admin_speech_mode';
const STORAGE_KEY_RATE = 'menu_app_admin_speech_rate';

export function useAdminSpeech() {
  const [isSpeechEnabled, setIsSpeechEnabled] = useState<boolean>(true);
  const [speechMode, setSpeechModeState] = useState<SpeechMode>('full');
  const [speechRate, setSpeechRateState] = useState<number>(1.1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isSpeechEnabledRef = useRef<boolean>(true);
  const speechModeRef = useRef<SpeechMode>('full');
  const speechRateRef = useRef<number>(1.1);

  // 1. 初始化讀取偏好設定
  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED);
      if (savedEnabled !== null) {
        const val = savedEnabled === 'true';
        setIsSpeechEnabled(val);
        isSpeechEnabledRef.current = val;
      }
      const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as SpeechMode;
      if (savedMode === 'full' || savedMode === 'summary') {
        setSpeechModeState(savedMode);
        speechModeRef.current = savedMode;
      }
      const savedRate = localStorage.getItem(STORAGE_KEY_RATE);
      if (savedRate) {
        const num = parseFloat(savedRate);
        if (!isNaN(num) && num >= 0.7 && num <= 1.8) {
          setSpeechRateState(num);
          speechRateRef.current = num;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 2. 尋找最佳繁體中文（zh-TW）發音人
  const pickBestVoice = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // 優先順序：zh-TW 臺灣繁體 -> zh-HK 香港 -> 包含 zh 的通用中文發音人
    const twVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === 'zh-tw' ||
        v.lang.toLowerCase() === 'zh_tw' ||
        v.name.includes('Taiwan') ||
        v.name.includes('國語') ||
        v.name.includes('Hanhan') ||
        v.name.includes('Yating') ||
        v.name.includes('Mei-Jia')
    );
    const zhVoice = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
    preferredVoiceRef.current = twVoice || zhVoice || null;
  }, []);

  useEffect(() => {
    pickBestVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = pickBestVoice;
    }
  }, [pickBestVoice]);

  // 3. 處理語音播放佇列（確保多筆訂單連續湧入時依序朗讀，不重疊打架）
  const processQueue = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isProcessingQueueRef.current) return;
    if (speechQueueRef.current.length === 0) {
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = speechQueueRef.current.shift();
    if (!textToSpeak) return;

    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    try {
      // 確保瀏覽器語音引擎未處於暫停狀態
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = preferredVoiceRef.current?.lang || 'zh-TW';
      if (preferredVoiceRef.current) {
        utterance.voice = preferredVoiceRef.current;
      }
      utterance.rate = speechRateRef.current;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        isProcessingQueueRef.current = false;
        // 稍微間隔 180ms 播放下一筆
        setTimeout(() => {
          processQueue();
        }, 180);
      };

      utterance.onerror = (e) => {
        console.warn('語音播報發生錯誤或中斷:', e);
        isProcessingQueueRef.current = false;
        processQueue();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('執行語音播報失敗:', err);
      isProcessingQueueRef.current = false;
      processQueue();
    }
  }, []);

  // 4. 文案組裝產生器 (文案自然、符合臺灣在地口語習慣)
  const buildSpeechScript = useCallback((order: SpeechOrderPayload, mode: SpeechMode = speechModeRef.current): string => {
    const nickname = (order.nickname || '團員').trim();
    const totalAmount = Math.round(order.total_amount || 0);

    if (mode === 'summary') {
      const totalCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
      return `收到 ${nickname} 的新訂單，共 ${totalCount} 份餐點，金額 ${totalAmount} 元。`;
    }

    // 完整明細模式 (含品項名稱、數量與客製化備註)
    const itemScripts = (order.items || []).map((item) => {
      const itemName = (item.name || '餐點').trim();
      const qty = item.quantity || 1;
      const notes = (item.notes || '').trim();
      if (notes) {
        return `${itemName} ${qty} 份，${notes}`;
      }
      return `${itemName} ${qty} 份`;
    });

    const itemsText = itemScripts.length > 0 ? itemScripts.join('；') : '餐點 1 份';
    const totalItemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

    return `收到 ${nickname} 的新訂單：${itemsText}。共 ${totalItemCount} 份，金額 ${totalAmount} 元。`;
  }, []);

  // 5. 朗讀訂單明細主入口 (支援 immediate: true 代表接單音效沒開時 0ms 直接即時播報)
  const speakOrder = useCallback(
    (order: SpeechOrderPayload, immediate: boolean = false) => {
      if (!isSpeechEnabledRef.current) return;
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const script = buildSpeechScript(order, speechModeRef.current);
      if (!script) return;

      const queueAction = () => {
        speechQueueRef.current.push(script);
        processQueue();
      };

      if (immediate) {
        // ⚡ 接單音效未開啟：0ms 立即直接語音朗讀！
        queueAction();
      } else {
        // 🎵 接單音效有開啟：緩衝 750ms 等待接單叮咚鈴聲結束後再開始朗讀
        setTimeout(() => {
          queueAction();
        }, 750);
      }
    },
    [buildSpeechScript, processQueue]
  );

  // 6. 🔊 一鍵立即試聽當前語音設定效果
  const playTestSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    isProcessingQueueRef.current = false;

    const sampleOrder: SpeechOrderPayload = {
      nickname: '小明',
      total_amount: 180,
      items: [
        { name: '招牌排骨便當', quantity: 1, notes: '微辣不要酸菜' },
        { name: '珍珠奶茶', quantity: 1, notes: '半糖去冰' },
      ],
    };

    const script = buildSpeechScript(sampleOrder, speechModeRef.current);
    speechQueueRef.current.push(script);
    processQueue();
  }, [buildSpeechScript, processQueue]);

  // 7. 切換語音開關
  const toggleSpeech = useCallback((): boolean => {
    const next = !isSpeechEnabledRef.current;
    setIsSpeechEnabled(next);
    isSpeechEnabledRef.current = next;

    if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
    }

    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(next));
    } catch (e) {
      console.error(e);
    }
    return next;
  }, []);

  // 8. 設定播報詳細度模式
  const setSpeechMode = useCallback((mode: SpeechMode) => {
    setSpeechModeState(mode);
    speechModeRef.current = mode;
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 9. 設定語音語速 (0.8x ~ 1.5x)
  const setSpeechRate = useCallback((rate: number) => {
    setSpeechRateState(rate);
    speechRateRef.current = rate;
    try {
      localStorage.setItem(STORAGE_KEY_RATE, String(rate));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 10. 停止所有語音
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeechEnabled,
    speechMode,
    speechRate,
    isSpeaking,
    speakOrder,
    playTestSpeech,
    toggleSpeech,
    setSpeechMode,
    setSpeechRate,
    stopSpeech,
  };
}
