'use client';

import { useState, useCallback } from 'react';

/**
 * 輕量 Toast 通知 Hook，統一管理短暫提示訊息的顯示與自動消失邏輯。
 * 取代各頁面重複定義的 showToast + setToastMessage + setTimeout 組合。
 *
 * @param durationMs - Toast 顯示時間（毫秒，預設 2500ms）
 */
export function useToast(durationMs: number = 2500) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), durationMs);
    },
    [durationMs]
  );

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return { toastMessage, showToast, dismissToast };
}
