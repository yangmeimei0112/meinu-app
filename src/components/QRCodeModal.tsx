'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

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
  const [targetUrl, setTargetUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // 確保 Client-side 渲染 Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // 取得當前網址
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTargetUrl(url || window.location.origin);
    }
  }, [url, isOpen]);

  // 按 ESC 鍵關閉與鎖定背景滾動
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative transform transition-all my-auto max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          aria-label="關閉"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 標題區 */}
        <div className="text-center mb-4 shrink-0">
          <div className="text-3xl mb-1">📱</div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">使用手機相機掃描 QR Code 即可開啟網頁</p>
        </div>

        {/* QR Code 展示區 */}
        <div className="flex justify-center mb-4 shrink-0">
          <div
            ref={qrContainerRef}
            className="p-4 bg-white rounded-xl border-2 border-sky-100 shadow-inner flex items-center justify-center"
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
              <div className="w-[180px] h-[180px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-gray-400">
                載入中...
              </div>
            )}
          </div>
        </div>

        {/* 網址欄與複製 */}
        <div className="bg-sky-50/70 rounded-lg p-2.5 mb-4 flex items-center justify-between text-xs border border-sky-100 shrink-0">
          <span className="text-sky-800 font-mono truncate mr-2 flex-1">
            {targetUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-white hover:bg-sky-100 text-sky-700 px-2.5 py-1 rounded border border-sky-200 font-medium transition shrink-0 active:scale-95"
          >
            {copied ? '✓ 已複製' : '複製'}
          </button>
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 text-sm shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下載圖片
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl transition text-sm active:scale-95"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}