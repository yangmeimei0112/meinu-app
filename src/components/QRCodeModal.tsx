'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Check, Download } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  url,
  title = '掃碼直達「咩nu」大廳',
}: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const targetUrl = url || (typeof window !== 'undefined' ? window.location.origin : '');

  // 確保 Client-side 渲染 Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // 按 ESC 鍵關閉與鎖定背景滾動
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      try {
        if (typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
          window.addEventListener('keydown', handleKeyDown);
        }
      } catch {}
    }
    return () => {
      document.body.style.overflow = 'unset';
      try {
        if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
          window.removeEventListener('keydown', handleKeyDown);
        }
      } catch {}
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // 複製網址
  const handleCopy = async () => {
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  // 下載 QR Code 為 PNG 圖片
  const handleDownload = () => {
    if (!qrContainerRef.current) return;
    const svgElement = qrContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 增加 Padding 邊框
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'meinu-qrcode.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#131B2B] text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative transform transition-all my-auto max-h-[90vh] overflow-y-auto flex flex-col border border-slate-100 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 標題區 */}
        <div className="text-center mb-4 shrink-0">
          <QrCode className="w-8 h-8 text-sky-500 mx-auto mb-1 stroke-[1.8]" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">使用手機相機掃描 QR Code 即可開啟網頁</p>
        </div>

        {/* QR Code 展示區 */}
        <div className="flex justify-center mb-4 shrink-0">
          <div
            ref={qrContainerRef}
            className="p-4 bg-white rounded-xl border-2 border-sky-100 dark:border-slate-700 shadow-inner flex items-center justify-center"
          >
            {targetUrl ? (
              <QRCodeSVG
                value={targetUrl}
                size={180}
                bgColor="#FFFFFF"
                fgColor="#0284c7"
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-[180px] h-[180px] bg-gray-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center text-xs text-gray-400">
                載入中...
              </div>
            )}
          </div>
        </div>

        {/* 網址欄與複製 */}
        <div className="bg-sky-50/70 dark:bg-slate-800/80 rounded-lg p-2.5 mb-4 flex items-center justify-between text-xs border border-sky-100 dark:border-slate-700 shrink-0">
          <span className="text-sky-800 dark:text-sky-300 font-mono truncate mr-2 flex-1">
            {targetUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-white dark:bg-slate-700 hover:bg-sky-100 dark:hover:bg-slate-600 text-sky-700 dark:text-sky-200 px-2.5 py-1 rounded border border-sky-200 dark:border-slate-600 font-medium transition shrink-0 active:scale-95 cursor-pointer flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>已複製</span>
              </>
            ) : (
              '複製'
            )}
          </button>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 text-sm shadow-sm active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>下載圖片</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium py-2.5 px-4 rounded-xl transition text-sm active:scale-95 cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}