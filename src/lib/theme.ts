'use client';

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

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
    (newTheme: ThemeMode, event?: React.MouseEvent | { clientX: number; clientY: number }) => {
      if (newTheme === theme) return;

      // 檢查瀏覽器是否支援現代 View Transitions API 且未開啟「減少動態效果」
      const isViewTransitionSupported =
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        typeof window !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!isViewTransitionSupported) {
        applyTheme(newTheme);
        return;
      }

      // 取得觸發點座標（若未傳入則預設螢幕中心）
      const x = event ? ('clientX' in event ? event.clientX : window.innerWidth / 2) : window.innerWidth / 2;
      const y = event ? ('clientY' in event ? event.clientY : window.innerHeight / 2) : window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = (document as any).startViewTransition(() => {
        applyTheme(newTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: newTheme === 'dark' ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 380,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            pseudoElement: newTheme === 'dark' ? '::view-transition-new(root)' : '::view-transition-old(root)',
          }
        );
      });
    },
    [theme, applyTheme]
  );

  const toggleTheme = useCallback(
    (event?: React.MouseEvent | { clientX: number; clientY: number }) => {
      const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme, event);
    },
    [theme, setTheme]
  );

  return { theme, setTheme, toggleTheme, mounted };
}
