'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  submissionId: string;
  storeName?: string;
  totalAmount?: number;
}

export default function OrderSuccessModal({
  isOpen,
  orderNumber,
  submissionId,
  storeName,
  totalAmount,
}: OrderSuccessModalProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    // 1.8 秒平滑進度條動畫與自動跳轉
    const startTime = Date.now();
    const duration = 1800;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timer);
        router.push(`/order-status/${submissionId}`);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [isOpen, submissionId, router]);

  const handleInstantNavigate = () => {
    router.push(`/order-status/${submissionId}`);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-[#131B2B] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* 背景裝飾光暈 */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-200/40 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-200/40 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* 🌟 精緻純向量可愛「咩nu 主廚小羊」慶祝動畫 */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          {/* 外圈光芒波浪 */}
          <div className="absolute inset-0 rounded-full bg-linear-to-tr from-amber-200/50 via-emerald-200/40 to-sky-200/50 dark:from-amber-500/20 dark:via-emerald-500/15 dark:to-sky-500/20 animate-ping opacity-30 pointer-events-none" />
          <div className="absolute inset-1 rounded-full bg-linear-to-b from-amber-50 to-emerald-50/80 dark:from-slate-800 dark:to-slate-850 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-inner" />

          {/* 可愛主廚小羊 SVG */}
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24 relative z-10 drop-shadow-md animate-bounce"
            style={{ animationDuration: '1.2s' }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 小羊耳朵（左 & 右） */}
            <ellipse cx="26" cy="46" rx="9" ry="6" transform="rotate(-25 26 46)" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
            <ellipse cx="26" cy="46" rx="5" ry="3" transform="rotate(-25 26 46)" fill="#FCA5A5" />
            <ellipse cx="74" cy="46" rx="9" ry="6" transform="rotate(25 74 46)" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
            <ellipse cx="74" cy="46" rx="5" ry="3" transform="rotate(25 74 46)" fill="#FCA5A5" />

            {/* 小羊蓬鬆羊毛身形 (雲朵型多重圓) */}
            <circle cx="50" cy="54" r="26" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="34" cy="42" r="10" fill="#FFFFFF" />
            <circle cx="66" cy="42" r="10" fill="#FFFFFF" />
            <circle cx="50" cy="34" r="11" fill="#FFFFFF" />
            <circle cx="30" cy="58" r="10" fill="#FFFFFF" />
            <circle cx="70" cy="58" r="10" fill="#FFFFFF" />
            <circle cx="40" cy="70" r="9" fill="#FFFFFF" />
            <circle cx="60" cy="70" r="9" fill="#FFFFFF" />

            {/* 臉部主輪廓 */}
            <ellipse cx="50" cy="56" rx="16" ry="14" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />

            {/* 雙眼 (俏皮瞇瞇笑眼) */}
            <path d="M42 53C42 51.5 44 50 46 51.5" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <path d="M54 51.5C56 50 58 51.5 58 53" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

            {/* 可愛粉嫩腮紅 */}
            <circle cx="39" cy="58" r="3" fill="#FDA4AF" opacity="0.8" />
            <circle cx="61" cy="58" r="3" fill="#FDA4AF" opacity="0.8" />

            {/* 嘴巴與小鼻 */}
            <path d="M49 57L51 57L50 59Z" fill="#F43F5E" />
            <path d="M47 61C48.5 63 51.5 63 53 61" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" />

            {/* 主廚小高帽 */}
            <path d="M44 32C44 26 48 24 50 24C52 24 56 26 56 32Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
            <rect x="42" y="31" width="16" height="4" rx="2" fill="#E2E8F0" />
            <circle cx="47" cy="25" r="4" fill="#FFFFFF" />
            <circle cx="53" cy="25" r="4" fill="#FFFFFF" />

            {/* 手中托舉的精緻便當/餐盤 */}
            <rect x="36" y="68" width="28" height="6" rx="3" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
            <circle cx="50" cy="67" r="3" fill="#F59E0B" />
          </svg>

          {/* 右下角綠色成功勾勾印章徽章 */}
          <div className="absolute -bottom-1 -right-1 z-20 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800 scale-100 animate-in zoom-in-50 duration-300 delay-150">
            <svg className="w-5 h-5 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* 標題與單號呈現 */}
        <div className="space-y-1.5 pt-1">
          <h3
            id="order-success-title"
            className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight"
          >
            訂單已成功送出
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {storeName ? `${storeName} · ` : ''}您的餐點需求已即時同步給團長
          </p>
        </div>

        {/* 單號與金額標籤卡片 */}
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block">
              專屬訂單編號
            </span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-wide">
              #{orderNumber}
            </span>
          </div>

          {typeof totalAmount === 'number' && (
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block">
                應付總金額
              </span>
              <span className="text-base font-black font-mono text-slate-700 dark:text-slate-200">
                ${totalAmount}
              </span>
            </div>
          )}
        </div>

        {/* 自動跳轉平滑進度條 */}
        <div className="space-y-2 pt-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-emerald-400 to-sky-500 h-full rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>正在前往即時對帳與訂單明細頁面...</span>
          </p>
        </div>

        {/* 手動快速進入按鈕 */}
        <button
          type="button"
          onClick={handleInstantNavigate}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition active:scale-98 cursor-pointer"
        >
          立即查看訂單狀態 ➔
        </button>
      </div>
    </div>
  );
}
