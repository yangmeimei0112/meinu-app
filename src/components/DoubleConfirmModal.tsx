'use client';

import { useEffect } from 'react';

interface DoubleConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onTimerPause?: (pause: boolean) => void;
}

export default function DoubleConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '確定執行',
  cancelText = '再想想',
  isDanger = false,
  onConfirm,
  onCancel,
  onTimerPause,
}: DoubleConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      if (onTimerPause) onTimerPause(true);
    } else {
      if (onTimerPause) onTimerPause(false);
    }
  }, [isOpen, onTimerPause]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800">
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-2xl ${
            isDanger ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500' : 'bg-sky-50 dark:bg-sky-950/60 text-sky-500'
          }`}>
            {isDanger ? '⚠️' : '❓'}
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-2xl text-xs transition active:scale-95 border border-transparent dark:border-slate-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full text-white font-bold py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-95 ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
