'use client';

import React from 'react';
import { Banknote, Coins } from 'lucide-react';

interface AdminChangeModalProps {
  changeModalTarget: { nickname: string; amount: number } | null;
  receivedCash: string;
  setReceivedCash: (val: string) => void;
  onClose: () => void;
}

export default function AdminChangeModal({
  changeModalTarget,
  receivedCash,
  setReceivedCash,
  onClose,
}: AdminChangeModalProps) {
  if (!changeModalTarget) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-xs rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-center shadow-2xl">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
          <Banknote className="w-5 h-5 text-emerald-500" />
          <span>現金找零試算器</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {changeModalTarget.nickname} 應付金額：
          <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm ml-1">
            ${changeModalTarget.amount} 元
          </span>
        </p>

        <label htmlFor="change-received-cash" className="sr-only">
          實收現金金額
        </label>
        <input
          id="change-received-cash"
          name="receivedCash"
          type="number"
          aria-label="實收現金金額"
          placeholder="例如：1000"
          value={receivedCash}
          onChange={(e) => setReceivedCash(e.target.value)}
          className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        {Number(receivedCash) > 0 && (
          <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-2xl border border-sky-100 dark:border-sky-900/60">
            <p className="text-xs text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>應找零金額</span>
            </p>
            <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
              ${Math.max(0, Number(receivedCash) - changeModalTarget.amount)} 元
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
        >
          完成關閉
        </button>
      </div>
    </div>
  );
}
