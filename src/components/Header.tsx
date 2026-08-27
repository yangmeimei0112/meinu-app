'use client';

import { useState, useSyncExternalStore, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ClipboardList, Share2, QrCode } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

export const ORDERS_UPDATE_EVENT = 'menu_app_orders_updated';

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined' || !window || typeof window.addEventListener !== 'function') return () => {};
  try {
    window.addEventListener('storage', callback);
    window.addEventListener(ORDERS_UPDATE_EVENT, callback);
  } catch {}
  return () => {
    try {
      if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
        window.removeEventListener('storage', callback);
        window.removeEventListener(ORDERS_UPDATE_EVENT, callback);
      }
    } catch {}
  };
}

// 🛡️ 嚴格檢查是否「確實有新送出且未查看的歷史訂單」
function getHasNewOrdersSnapshot() {
  if (typeof window === 'undefined') return false;
  try {
    // 1. 嚴格檢查歷史訂單紀錄是否存在且長度大於 0 (防範 "[]" 空陣列誤判)
    let hasActualOrders = false;
    const historyRaw = localStorage.getItem('menu_app_order_history');
    if (historyRaw) {
      const list = JSON.parse(historyRaw);
      if (Array.isArray(list) && list.length > 0) {
        hasActualOrders = true;
      }
    }
    const lastId = localStorage.getItem('menu_app_last_order_id');
    if (lastId && typeof lastId === 'string' && lastId.trim().length > 0) {
      hasActualOrders = true;
    }

    // 若完全沒有任何訂單，絕對不閃爍紅點
    if (!hasActualOrders) {
      return false;
    }

    // 2. 只有在有新送出且尚未進入「我的訂單」頁面查看時，才閃爍紅點
    return localStorage.getItem('menu_app_has_new_order') === 'true';
  } catch {
    return false;
  }
}

export default function Header() {
  const [shortCode, setShortCode] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const hasNewOrder = useSyncExternalStore(subscribeStorage, getHasNewOrdersSnapshot, () => false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSearchCode = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shortCode.trim()) return;
    showToast(`正在搜尋團購快碼：#${shortCode}`);
  };

  const handleSharePlatform = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareData = {
      title: '咩nu (meinu) - 揪團點餐平台',
      text: '咩好的一天就從點餐開始！快來看看今天想吃什麼?點擊連結選擇店家開始點餐。',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // 使用者取消分享不處理
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('平台大廳連結已複製至剪貼簿！');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-sky-100 dark:border-slate-800 shadow-xs">
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between gap-1.5">
        {/* SVG Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition">
          <Image
            src="/logoforfrontpage.svg"
            alt="咩nu Logo"
            width={100}
            height={32}
            priority
            className="object-contain h-7 w-auto dark:brightness-110"
          />
        </Link>

        {/* 快碼搜尋 */}
        <form onSubmit={handleSearchCode} className="flex-1 max-w-[105px]">
          <div className="relative">
            <label htmlFor="header-shortcode-input" className="sr-only">活動快碼</label>
            <input
              id="header-shortcode-input"
              name="shortCode"
              type="text"
              aria-label="活動快碼"
              maxLength={6}
              placeholder="#快碼"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-50 dark:bg-[#182234] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl py-1 px-2.5 text-xs text-center font-mono font-bold tracking-wider placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 p-0.5 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1 shrink-0">
          {/* 我的訂單按鈕 (僅在有全新歷史訂單時閃爍紅點) */}
          <Link
            href="/my-orders"
            className="relative bg-sky-50 hover:bg-sky-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 px-2 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 border border-sky-100 dark:border-slate-700 active:scale-95"
            title="查看我的送訂紀錄與付款狀態"
          >
            <ClipboardList className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>訂單</span>
            {hasNewOrder && (
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </Link>

          {/* 分享平台 */}
          <button
            type="button"
            onClick={handleSharePlatform}
            className="bg-sky-50 hover:bg-sky-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-300 px-2 py-1.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 border border-sky-100 dark:border-slate-700 active:scale-95 cursor-pointer"
            title="分享平台"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>分享</span>
          </button>

          {/* 現場 QR Code */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-sky-50 hover:bg-sky-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-300 p-1.5 rounded-xl transition flex items-center justify-center border border-sky-100 dark:border-slate-700 active:scale-95 cursor-pointer"
            title="顯示現場 QR Code"
          >
            <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-300 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 現場 QR Code 彈窗 */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="咩nu 點餐大廳 QR Code"
      />
    </header>
  );
}