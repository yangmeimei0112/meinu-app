'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    // 初始檢測與監聽網路狀態
    setIsOffline(!navigator.onLine);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-900 text-xs font-bold px-4 py-2 text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-1.5 animate-in slide-in-from-top duration-200">
      <span>⚠️</span>
      <span>目前網路連線不穩定，請放心！您的購物車與選擇已自動儲存在手機中。</span>
    </div>
  );
}