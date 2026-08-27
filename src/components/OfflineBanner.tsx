'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function getSnapshot() {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined' || !window || typeof window.addEventListener !== 'function') return () => {};
  try {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
  } catch {}
  return () => {
    try {
      if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      }
    } catch {}
  };
}

export default function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-900 text-xs font-bold px-4 py-2 text-center sticky top-0 z-50 shadow-sm flex items-center justify-center gap-1.5 animate-in slide-in-from-top duration-200">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>目前網路連線不穩定，請放心！您的購物車與選擇已自動儲存在手機中。</span>
    </div>
  );
}