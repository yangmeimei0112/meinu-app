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
    (newTheme: ThemeMode, event?: React.MouseEvent | { clientX: number; clientY: number }) => {
      if (newTheme === theme) return;

      if (typeof document === 'undefined') {
        applyTheme(newTheme);
        return;
      }

      // 1. 啟動階梯式模組過渡引擎 (Staggered Cascading Engine)
      // 讓頁面各模組按空間視覺順序依序優雅接續過渡，徹底消除全站同時切換的閃爍生硬感
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      document.documentElement.classList.add('theme-transitioning');
      transitionTimerRef.current = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        transitionTimerRef.current = null;
      }, 750);

      // 2. 檢查瀏覽器是否支援現代 View Transitions API 且未開啟「減少動態效果」
      const isViewTransitionSupported =
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
        // 🌟 防刺眼柔光擴散波 (Anti-Glare Feathered Luminescence Wave)
        // 新主題層由觸發點以極度柔順的羽化波紋擴散，伴隨微調透明度與色溫平滑過渡，徹底消除強光爆閃與生硬切割感
        const isSwitchingToLight = newTheme === 'light';

        document.documentElement.animate(
          [
            {
              clipPath: `circle(0px at ${x}px ${y}px)`,
              opacity: isSwitchingToLight ? 0.35 : 0.5,
              filter: isSwitchingToLight ? 'brightness(0.96) saturate(0.95)' : 'brightness(1.05)',
            },
            {
              clipPath: `circle(${endRadius}px at ${x}px ${y}px)`,
              opacity: 1,
              filter: 'brightness(1) saturate(1)',
            },
          ],
          {
            duration: 620,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );

        document.documentElement.animate(
          [
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0.7, transform: 'scale(0.998)' },
          ],
          {
            duration: 520,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-old(root)',
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
