'use client';

import { useState, useEffect } from 'react';

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isSafari: boolean;
  isStandalone: boolean;
}

/**
 * 取得當前執行平台資訊（支援 iOS, Android, PWA 獨立視窗與 Safari 檢測）
 */
export function getPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isSafari: false,
      isStandalone: false,
    };
  }

  const ua = navigator.userAgent || '';
  // 支援 iPhone, iPad, iPod 及 iPadOS (MacIntel + multi-touch)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi|Tablet|Touch/i.test(ua);
  const isSafari =
    /Safari/i.test(ua) && !/Chrome|Chromium|Edg|CriOS|FxiOS|OPR/i.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isSafari,
    isStandalone,
  };
}

/**
 * React Hook: 即時提供跨平台環境資訊，並自動在 <html> 標籤注入特徵 class（.is-ios, .is-android, .is-standalone）
 */
export function usePlatform(): PlatformInfo {
  const [platform, setPlatform] = useState<PlatformInfo>(getPlatformInfo);

  useEffect(() => {
    const info = getPlatformInfo();
    setPlatform(info);

    const html = document.documentElement;
    if (info.isIOS) html.classList.add('is-ios');
    if (info.isAndroid) html.classList.add('is-android');
    if (info.isSafari) html.classList.add('is-safari');
    if (info.isStandalone) html.classList.add('is-standalone');
  }, []);

  return platform;
}
