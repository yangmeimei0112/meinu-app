'use client';

import React from 'react';

interface OrderStatusActionsProps {
  timeLeft: number;
  isClosed: boolean;
  isActionDisabled: boolean;
  onOpenModify: () => void;
  onOpenCancel: () => void;
}

export default function OrderStatusActions({
  timeLeft,
  isClosed,
  isActionDisabled,
  onOpenModify,
  onOpenCancel,
}: OrderStatusActionsProps) {
  const isTimeUp = timeLeft === 0;

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-3.5 border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⏳</span>
          <div>
            <h3 className="text-xs font-extrabold text-slate-200">1分鐘限時自主改單/取消</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isClosed
                ? '團長已截單，停止改單'
                : isTimeUp
                ? '已逾 60 秒，如需修改請聯繫團長'
                : '送單後 60 秒內可自行修改或取消'}
            </p>
          </div>
        </div>

        <span
          className={`font-mono text-sm font-extrabold px-3 py-1 rounded-xl border transition-colors ${
            isTimeUp || isClosed
              ? 'bg-slate-800 text-slate-500 border-slate-700'
              : 'bg-sky-950 text-sky-400 border-sky-800'
          }`}
        >
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </span>
      </div>

      {/* 操作按鈕群：修改訂單 & 取消訂單 */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          disabled={isActionDisabled}
          onClick={onOpenModify}
          className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
            isActionDisabled
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
          }`}
        >
          <span>✏️ 修改訂單</span>
        </button>

        <button
          type="button"
          disabled={isActionDisabled}
          onClick={onOpenCancel}
          className={`py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
            isActionDisabled
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
          }`}
        >
          <span>🗑️ 取消訂單</span>
        </button>
      </div>
    </div>
  );
}
