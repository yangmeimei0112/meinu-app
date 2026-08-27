'use client';

import { useState, useRef, useCallback } from 'react';
import type { MenuItem } from '@/types/database';

interface UseMenuStudioDragProps {
  orderedItems: MenuItem[];
  isFiltering: boolean;
  onCommitReorder: (newItems: MenuItem[]) => void;
}

export function useMenuStudioDrag({
  orderedItems,
  isFiltering,
  onCommitReorder,
}: UseMenuStudioDragProps) {
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchDraggingRef = useRef<boolean>(false);
  const touchCurrentTargetIdRef = useRef<string | null>(null);
  const touchSourceIdRef = useRef<string | null>(null);

  // 核心重排執行
  const executeReorder = useCallback(
    (sourceId: string, targetId: string) => {
      const fromIdx = orderedItems.findIndex((i) => i.id === sourceId);
      const toIdx = orderedItems.findIndex((i) => i.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      const newItems = [...orderedItems];
      const [moved] = newItems.splice(fromIdx, 1);
      newItems.splice(toIdx, 0, moved);
      onCommitReorder(newItems);
    },
    [orderedItems, onCommitReorder]
  );

  // 💻 電腦端 HTML5 滑鼠點按拖曳
  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      if (isFiltering) return;
      const target = e.target as HTMLElement;
      // 避免點擊按鈕或輸入框時誤觸拖曳
      if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
      setActiveDraggingId(id);
    },
    [isFiltering]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      if (isFiltering) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverItemId !== targetId) {
        setDragOverItemId(targetId);
      }
    },
    [isFiltering, dragOverItemId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      if (isFiltering) return;
      e.preventDefault();
      const sourceId = activeDraggingId || e.dataTransfer.getData('text/plain');
      setActiveDraggingId(null);
      setDragOverItemId(null);

      if (!sourceId || sourceId === targetId) return;
      executeReorder(sourceId, targetId);
    },
    [isFiltering, activeDraggingId, executeReorder]
  );

  const handleDragEnd = useCallback(() => {
    setActiveDraggingId(null);
    setDragOverItemId(null);
  }, []);

  // 📱 手機端觸控 180ms 長按手勢
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, id: string) => {
      if (isFiltering) return;
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
        return;
      }

      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      isTouchDraggingRef.current = false;
      touchSourceIdRef.current = id;

      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }

      // 長按 180ms 啟動拖曳模態
      touchTimerRef.current = setTimeout(() => {
        isTouchDraggingRef.current = true;
        setActiveDraggingId(id);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(35);
          } catch {}
        }
      }, 180);
    },
    [isFiltering]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartPosRef.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

      if (!isTouchDraggingRef.current) {
        // 未達長按門檻前移動超過 8px，判定為正常網頁滾動
        if (dx > 8 || dy > 8) {
          if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
          }
        }
        return;
      }

      // 已進入長按拖曳：阻止原生滑動
      if (e.cancelable) {
        e.preventDefault();
      }

      // 偵測手指正下方的卡片
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cardEl = el?.closest('[data-item-card-id]') as HTMLElement | null;
      const hoverId = cardEl?.getAttribute('data-item-card-id');

      if (hoverId && hoverId !== touchSourceIdRef.current) {
        touchCurrentTargetIdRef.current = hoverId;
        setDragOverItemId(hoverId);
      } else {
        touchCurrentTargetIdRef.current = null;
        setDragOverItemId(null);
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    if (isTouchDraggingRef.current && touchSourceIdRef.current && touchCurrentTargetIdRef.current) {
      const sourceId = touchSourceIdRef.current;
      const targetId = touchCurrentTargetIdRef.current;
      if (sourceId !== targetId) {
        executeReorder(sourceId, targetId);
      }
    }

    isTouchDraggingRef.current = false;
    touchStartPosRef.current = null;
    touchSourceIdRef.current = null;
    touchCurrentTargetIdRef.current = null;
    setActiveDraggingId(null);
    setDragOverItemId(null);
  }, [executeReorder]);

  return {
    activeDraggingId,
    dragOverItemId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
