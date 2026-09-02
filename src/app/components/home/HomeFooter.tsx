'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import { formatVersionDisplay } from '@/lib/formatVersion';
import { Sun, Moon } from 'lucide-react';

interface HomeFooterProps {
  commitMsg: string;
  commitHash: string;
}

export function HomeFooter({ commitMsg, commitHash }: HomeFooterProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="w-full py-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <div className="flex items-center gap-2">
        <span
          title={commitMsg}
          className="cursor-help transition-colors hover:text-slate-600 dark:hover:text-slate-300 select-none font-mono"
        >
          版本: {formatVersionDisplay(commitMsg, commitHash)}
        </span>
        <span>•</span>
        <Link
          href="/admin"
          className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors hover:underline underline-offset-2"
        >
          後台登入
        </Link>
      </div>

      <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

      {/* 🌗 主題切換按鈕 */}
      <button
        type="button"
        onClick={(e) => toggleTheme(e)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition active:scale-95 cursor-pointer"
        title={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
        aria-label={`切換為${theme === 'dark' ? '亮色' : '暗色'}主題`}
      >
        {theme === 'dark' ? (
          <Sun className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-sky-500" />
        )}
        <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
      </button>
    </footer>
  );
}
