'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ThemeMode = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('menu_app_theme') as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored);
        document.documentElement.classList.toggle('dark', stored === 'dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const applyTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('menu_app_theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    } catch {}
  }, []);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      if (newTheme === theme) return;

      if (typeof document === 'undefined') {
        applyTheme(newTheme);
        return;
      }

      // 🌊 啟動純粹的模塊接續階梯過渡引擎 (Staggered Cascading Theme Engine)
      // 頁面各個視覺區塊按空間由上至下、由焦點向外以微小順序延遲接續變換，呈現骨牌／水波漣漪般的流體節奏感
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      document.documentElement.classList.add('theme-transitioning');
      applyTheme(newTheme);

      transitionTimerRef.current = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        transitionTimerRef.current = null;
      }, 750);
    },
    [theme, applyTheme]
  );

  const toggleTheme = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_event?: any) => {
      const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
    },
    [theme, setTheme]
  );

  return { theme, setTheme, toggleTheme, mounted };
}
