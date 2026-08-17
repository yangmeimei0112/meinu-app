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

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('menu_app_theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme, mounted };
}
