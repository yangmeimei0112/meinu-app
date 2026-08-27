'use client';

import React from 'react';
import type { MenuItem } from '@/types/database';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
} from 'lucide-react';

interface AdminMenuItemCardProps {
  item: MenuItem;
  globalIndex: number;
  isAtTop: boolean;
  isAtBottom: boolean;
  isFiltering: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onMoveToTop: (id: string) => void;
  onMoveStep: (id: string, direction: 'up' | 'down') => void;
  onMoveToBottom: (id: string) => void;
  onToggleActive: (id: string) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function AdminMenuItemCard({
  item,
  globalIndex,
  isAtTop,
  isAtBottom,
  isFiltering,
  isDragging,
  isDragOver,
  onMoveToTop,
  onMoveStep,
  onMoveToBottom,
  onToggleActive,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: AdminMenuItemCardProps) {
  return (
    <div
      data-id={item.id}
      data-item-card-id={item.id}
      draggable={!isFiltering}
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDrop={(e) => onDrop(e, item.id)}
      onTouchStart={(e) => onTouchStart(e, item.id)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className={`rounded-3xl p-5 border space-y-3.5 flex flex-col justify-between backdrop-blur-md select-none transition-all duration-200 ${
        !isFiltering ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-sky-400 bg-sky-50/50 dark:bg-sky-950/40 shadow-2xl ring-2 ring-sky-400 z-30'
          : isDragOver
          ? 'ring-2 ring-sky-500 border-sky-500 shadow-lg scale-[1.02] bg-sky-50/60 dark:bg-sky-950/50 z-20'
          : !item.is_sold_out
          ? 'bg-white/95 dark:bg-[#0E1726]/95 border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md'
          : 'bg-slate-50/70 dark:bg-[#121622]/70 opacity-80 border-dashed border-slate-300 dark:border-slate-800'
      }`}
    >
      <div className="space-y-2.5">
        {/* 頂部：序號標註 (#1, #2...) ＋ 拖曳手把 ＋ 快速調序控制 ＋ 售罄切換 */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 醒目序號標章 (展示目前排定順位) */}
            <span
              className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-mono font-black text-xs px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 shadow-2xs shrink-0"
              title={`全店第 ${globalIndex + 1} 順位`}
            >
              #{globalIndex + 1}
            </span>

            {/* 專屬純向量拖曳提示手把 */}
            {!isFiltering && (
              <span
                className="text-slate-400 p-1 rounded-lg pointer-events-none"
                title="長按整張卡片或按住拖曳挪動順序"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </span>
            )}

            {/* 🚀 快速調序控制群組：置頂 ＋ 上移 ＋ 下移 ＋ 置底 */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80">
              {/* 一鍵置頂 */}
              <button
                type="button"
                disabled={isAtTop}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToTop(item.id);
                }}
                className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                title="移至最前 (一鍵置頂)"
                aria-label="移至最前"
              >
                <ArrowUpToLine className="w-3 h-3" />
              </button>

              {/* 上移一位 */}
              <button
                type="button"
                disabled={isAtTop}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStep(item.id, 'up');
                }}
                className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                title="向上挪一位"
                aria-label="向上挪一位"
              >
                <ChevronUp className="w-3 h-3" />
              </button>

              {/* 下移一位 */}
              <button
                type="button"
                disabled={isAtBottom}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStep(item.id, 'down');
                }}
                className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                title="向下挪一位"
                aria-label="向下挪一位"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* 一鍵置底 */}
              <button
                type="button"
                disabled={isAtBottom}
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToBottom(item.id);
                }}
                className="w-5 h-5 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition"
                title="移至最後 (一鍵置底)"
                aria-label="移至最後"
              >
                <ArrowDownToLine className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 上下架狀態切換 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(item.id);
            }}
            className={`text-[10px] font-black px-2.5 py-1 rounded-full transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1 ${
              !item.is_sold_out
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800/80'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {!item.is_sold_out ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>上架中</span>
              </>
            ) : (
              <>
                <Circle className="w-3 h-3 text-slate-400" />
                <span>已下架</span>
              </>
            )}
          </button>
        </div>

        {/* 餐點名稱與價格 */}
        <div>
          <h4 className="font-black text-slate-900 dark:text-slate-100 text-base truncate">{item.name}</h4>
          <p className="text-sky-600 dark:text-sky-400 font-black text-base mt-0.5 font-mono">
            ${item.price}{' '}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">元</span>
          </p>
        </div>

        {/* 商品描述 */}
        {item.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-[#152033] p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 font-medium">
            {item.description}
          </p>
        )}

        {/* 客製化規格標籤展示 */}
        <div className="space-y-1 pt-1">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            規格群組 ({item.custom_groups?.length || 0} 組)：
          </p>
          {item.custom_groups && item.custom_groups.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {item.custom_groups.map((cg) => (
                <span
                  key={cg.id}
                  className="text-[10px] bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 font-bold px-2.5 py-0.5 rounded-xl border border-sky-200/80 dark:border-sky-800/60"
                >
                  {cg.title} ({cg.type === 'single' ? '單選' : '多選'} • {cg.options.length}項)
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">固定規格（無額外選項）</p>
          )}
        </div>
      </div>

      {/* 底部操作按鈕 */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="flex-1 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 text-xs font-black py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 border border-sky-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>編輯餐點與規格</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
          title="刪除餐點"
          aria-label="刪除餐點"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
