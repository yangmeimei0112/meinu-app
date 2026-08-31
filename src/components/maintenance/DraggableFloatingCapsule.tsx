'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { MaintenanceScope } from '@/app/api/system/maintenance/route';

function IconAlertTriangle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconZap({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconMove({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

interface DraggableFloatingCapsuleProps {
  countdown: number;
  scope?: MaintenanceScope;
  scopeLabel?: string;
  onExpand: () => void;
}

// ----------------------------------------------------
// 📱 極致 0 延遲原生 Pointer 拖曳懸浮倒數膠囊組件
// 依「全站維護」與「單一頁面特定維護」呈現獨立專屬視覺風格
// ----------------------------------------------------
export function DraggableFloatingCapsule({
  countdown,
  scope = 'all',
  scopeLabel = '',
  onExpand,
}: DraggableFloatingCapsuleProps) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 16,
    initialPosY: 16,
    hasMoved: false,
  });
  const capsuleRef = useRef<HTMLDivElement>(null);

  const isSinglePage = scope && scope !== 'all';

  // 初始化預設位置（置於螢幕頂部居中偏右）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultWidth = isSinglePage ? 245 : 225;
      const initialX = Math.max(12, Math.min(window.innerWidth - defaultWidth - 12, (window.innerWidth - defaultWidth) / 2));
      const initialY = 16;
      setPos({ x: initialX, y: initialY });
      dragInfoRef.current.initialPosX = initialX;
      dragInfoRef.current.initialPosY = initialY;
    }
  }, [isSinglePage]);

  // 1. 原生 PointerDown：啟動指標捕獲與即時座標追蹤
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // 僅響應主鍵/單指點觸

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    isDraggingRef.current = true;
    setIsDragging(true);

    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: pos.x,
      initialPosY: pos.y,
      hasMoved: false,
    };
  };

  // 2. 原生 PointerMove：硬體加速 1:1 即時無延遲跟隨移動
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragInfoRef.current.hasMoved = true;
    }

    const elWidth = capsuleRef.current?.offsetWidth || 230;
    const elHeight = capsuleRef.current?.offsetHeight || 44;

    const newX = Math.max(8, Math.min(window.innerWidth - elWidth - 8, dragInfoRef.current.initialPosX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - elHeight - 8, dragInfoRef.current.initialPosY + dy));

    setPos({ x: newX, y: newY });
  };

  // 3. 原生 PointerUp：釋放指標捕獲，並精準判定是「輕觸展開」還是「拖曳結束」
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const moved = dragInfoRef.current.hasMoved;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (!moved) {
      onExpand();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  return (
    <div
      ref={capsuleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        zIndex: 99999,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      className={`select-none backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-2.5 pointer-events-auto cursor-grab active:cursor-grabbing will-change-transform ${
        isSinglePage
          ? 'bg-slate-950/95 text-violet-300 border-2 border-violet-500/80 shadow-2xl shadow-violet-500/30'
          : 'bg-slate-900/95 text-amber-400 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/30'
      } ${
        isDragging
          ? isSinglePage
            ? 'scale-105 shadow-violet-500/50 ring-4 ring-violet-400/40 transition-none'
            : 'scale-105 shadow-amber-500/50 ring-4 ring-amber-400/40 transition-none'
          : isSinglePage
          ? 'hover:scale-102 hover:border-violet-400 transition-transform duration-150'
          : 'hover:scale-102 hover:border-amber-400 transition-transform duration-150'
      }`}
    >
      <div className="flex items-center gap-1.5 pointer-events-none">
        {isSinglePage ? (
          <>
            <IconZap className="w-4 h-4 animate-pulse text-cyan-400 shrink-0" />
            <span className="tabular-nums font-black text-violet-200">
              {scopeLabel ? `【${scopeLabel}】` : ''}維護 {countdown}s
            </span>
          </>
        ) : (
          <>
            <IconAlertTriangle className="w-4 h-4 animate-pulse text-amber-400 shrink-0" />
            <span className="tabular-nums font-black text-amber-300">
              🚨 全站維護 {countdown}s
            </span>
          </>
        )}
      </div>

      <div
        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border pointer-events-none ${
          isSinglePage
            ? 'text-cyan-200 bg-violet-950/80 border-violet-700/60'
            : 'text-slate-300 bg-slate-800/90 border-slate-700'
        }`}
      >
        <IconMove className="w-3 h-3 opacity-70" />
        <span>拖移/展開</span>
      </div>
    </div>
  );
}
