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
    <footer className="w-full py-6 flex flex-col items-center justify-center gap-3 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      {/* 1. 版本號與後台登入 */}
      <div className="flex items-center justify-center gap-2">
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

      {/* 2. 服務協議、隱私政策、使用者條款、安全協議連結（版本號/後台登入下方，亮色模式上方） */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none">
        <Link
          href="/legal?tab=terms"
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors hover:underline underline-offset-2"
        >
          服務協議
        </Link>
        <span>•</span>
        <Link
          href="/legal?tab=privacy"
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors hover:underline underline-offset-2"
        >
          隱私政策
        </Link>
        <span>•</span>
        <Link
          href="/legal?tab=user-terms"
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors hover:underline underline-offset-2"
        >
          使用者條款
        </Link>
        <span>•</span>
        <Link
          href="/legal?tab=security"
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors hover:underline underline-offset-2"
        >
          安全協議
        </Link>
      </div>

      {/* 3. 亮色 / 暗色主題切換按鈕 */}
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
