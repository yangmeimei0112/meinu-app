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

    // ⚡ 立即在背景預先抓取訂單狀態頁面的路由與資源
    if (submissionId) {
      router.prefetch(`/order-status/${submissionId}`);
    }

    // 1.8 秒平滑進度條與自動跳轉
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-sm bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* 背景氛圍柔和光暈 */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-400/20 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* 🛵 高質感純向量「極速美味外送」動態場景 */}
        <div className="relative w-36 h-28 mx-auto flex items-center justify-center">
          {/* 閃耀星芒粒子（Staggered Sparkles） */}
          <div className="absolute top-1 left-4 w-3 h-3 text-amber-400 dark:text-amber-300 animate-pulse">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" /></svg>
          </div>
          <div className="absolute top-3 right-5 w-2.5 h-2.5 text-sky-400 dark:text-sky-300 animate-ping opacity-60">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 9.5L12 0Z" /></svg>
          </div>
          <div className="absolute bottom-6 left-2 w-2 h-2 text-emerald-400 dark:text-emerald-300 animate-pulse">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" /></svg>
          </div>

          {/* 外送小機車與騰雲外送箱 SVG */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <svg
              viewBox="0 0 120 90"
              className="w-32 h-24 drop-shadow-md animate-bounce"
              style={{ animationDuration: '1.4s' }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 裊裊熱氣（保溫箱上升香氣） */}
              <path d="M42 22C41 18 45 16 43 12" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
              <path d="M48 20C47 16 51 14 49 10" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              <path d="M54 22C53 18 57 16 55 12" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />

              {/* 外送保溫箱（經典薄荷綠 + 質感扣帶） */}
              <rect x="34" y="26" width="28" height="26" rx="4" fill="#10B981" stroke="#059669" strokeWidth="2" />
              {/* 保溫箱反光條 */}
              <rect x="34" y="36" width="28" height="4" fill="#F8FAFC" fillOpacity="0.9" />
              {/* 保溫箱品牌徽章 */}
              <circle cx="48" cy="46" r="3.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
              <path d="M48 44V48M46 46H50" stroke="#854D0E" strokeWidth="1.2" strokeLinecap="round" />

              {/* 機車車身主體（都會俐落流線） */}
              <path
                d="M58 44H80C82 44 84 46 84 48L80 62H48L58 44Z"
                fill="#38BDF8"
                stroke="#0284C7"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* 前導流板與龍頭 */}
              <path d="M78 44L86 30C87 28 89 28 91 28H94" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* 車把手 */}
              <rect x="91" y="26" width="5" height="3" rx="1.5" fill="#334155" />

              {/* 圓形復古車頭大燈（發射溫暖黃光） */}
              <ellipse cx="89" cy="34" rx="3.5" ry="5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5" />
              {/* 前大燈投射光束 */}
              <path d="M93 32L112 28L112 40L93 36Z" fill="#FDE047" fillOpacity="0.25" />

              {/* 駕駛座坐墊（典雅深咖） */}
              <path d="M56 42C56 39 60 38 68 38C74 38 78 40 78 42H56Z" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />

              {/* 後輪胎（深灰防滑胎 + 亮銀輪轂） */}
              <circle cx="40" cy="66" r="10" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
              <circle cx="40" cy="66" r="4.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />

              {/* 前輪胎 */}
              <circle cx="84" cy="66" r="10" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
              <circle cx="84" cy="66" r="4.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />

              {/* 機車避震懸吊支架 */}
              <path d="M84 66L82 48" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
              <path d="M40 66L50 56" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

              {/* 後方疾速風速線條（Wind Trails） */}
              <line x1="8" y1="46" x2="28" y2="46" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.6" strokeDasharray="3 3" />
              <line x1="14" y1="52" x2="30" y2="52" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.4" strokeDasharray="4 2" />

              {/* 地面疾馳虛線標線（Road Line） */}
              <line x1="2" y1="78" x2="118" y2="78" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeDasharray="8 6" />
            </svg>
          </div>

          {/* 右下角翠綠成功打勾印章徽章 */}
          <div className="absolute -bottom-0.5 right-2 z-20 w-8 h-8 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-850 animate-in zoom-in-50 duration-300 delay-100">
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
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
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
              <span className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                ${totalAmount}
              </span>
            </div>
          )}
        </div>

        {/* 自動跳轉平滑進度條 */}
        <div className="space-y-2 pt-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-emerald-400 via-teal-400 to-sky-500 h-full rounded-full transition-all duration-75 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>正在前往即時對帳與訂單明細頁面...</span>
          </p>
        </div>

        {/* 手動快速進入按鈕 */}
        <button
          type="button"
          onClick={handleInstantNavigate}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition active:scale-98 cursor-pointer shadow-2xs"
        >
          立即查看訂單狀態 ➔
        </button>
      </div>
    </div>
  );
}
