'use client';

import { useRef, useState, useEffect } from 'react';
import { PenTool } from 'lucide-react';

interface SignatureModalProps {
  nickname: string;
  onClose: () => void;
  onSaveSignature: (signatureData: string) => void;
}

export default function SignatureModal({
  nickname,
  onClose,
  onSaveSignature,
}: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0284c7'; // 天空藍筆觸
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  }, []);

  // 繪圖事件
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // 清空畫布
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 儲存簽名
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 animate-in zoom-in-95 duration-150 text-center">
        <div>
          <h3 className="text-base font-extrabold flex items-center justify-center gap-1.5">
            <PenTool className="w-4 h-4 text-sky-500" />
            <span>{nickname} 點餐付款簽名核實</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">請用手指或滑鼠在下方畫布簽名作為核對依據</p>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 touch-none">
          <canvas
            ref={canvasRef}
            width={300}
            height={160}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="w-full h-40 cursor-crosshair"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs"
          >
            重簽
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-xl text-xs shadow-xs"
          >
            確認簽名
          </button>
        </div>
      </div>
    </div>
  );
}