'use client';

import { useState, useEffect } from 'react';

/**
 * 輕量防抖 Hook：延遲更新高頻率變更的值（如搜尋關鍵字輸入），減少不必要的計算與重繪
 * @param value 需要防抖的值
 * @param delayMs 延遲毫秒數（預設 250ms）
 */
export function useDebounce<T>(value: T, delayMs: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
