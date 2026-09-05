'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, RotateCcw, CheckCircle2, Maximize2 } from 'lucide-react';
import SignatureModal from '@/components/SignatureModal';

interface CheckoutSignatureSectionProps {
  nickname: string;
  signatureData: string | null;
  onSignatureChange: (data: string | null) => void;
}

export default function CheckoutSignatureSection({
  nickname,
  signatureData,
  onSignatureChange,
}: CheckoutSignatureSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 初始化畫布上下文
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0284c7'; // 天空藍筆觸
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // 取得畫布相對座標
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.beginPath();

    // 每次繪圖筆畫結束，自動匯出 DataURL 快照
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // 清除畫布
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-sky-500" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
            對帳手繪簽名
          </h3>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            選填
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>全螢幕簽名</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        可在下方畫布簽名作為對帳憑證，送單後將自動產生電子簽章隨附於訂單收據。
      </p>

      {/* 畫布區域 */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white shadow-inner touch-none relative">
        <canvas
          ref={canvasRef}
          width={360}
          height={140}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          onTouchMove={draw}
          className="w-full h-32 cursor-crosshair block"
        />
        {!hasDrawn && !signatureData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-slate-300 dark:text-slate-600 select-none">
            請在此手寫簽名...
          </div>
        )}
      </div>

      {/* 簽名狀態與控制列 */}
      <div className="flex items-center justify-between pt-0.5">
        {signatureData || hasDrawn ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>已完成簽章</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">可留空直接送單</span>
        )}

        {(hasDrawn || signatureData) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>清除重簽</span>
          </button>
        )}
      </div>

      {/* 全螢幕簽名彈窗備援 */}
      {isModalOpen && (
        <SignatureModal
          nickname={nickname || '顧客'}
          onClose={() => setIsModalOpen(false)}
          onSaveSignature={(dataUrl) => {
            onSignatureChange(dataUrl);
            setHasDrawn(true);
            setIsModalOpen(false);

            // 若在彈窗簽名，同步在小畫布上呈現預覽
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => {
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = dataUrl;
            }
          }}
        />
      )}
    </div>
  );
}
