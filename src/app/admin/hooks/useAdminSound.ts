'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export function useAdminSound() {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const isSoundEnabledRef = useRef<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayTimeRef = useRef<number>(0);
  const hasUserGestureRef = useRef<boolean>(false);

  // 初始化讀取音效偏好並預載入 notification.mp3
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSound = localStorage.getItem('menu_app_admin_sound_enabled');
        if (savedSound !== null) {
          const enabled = savedSound === 'true';
          setIsSoundEnabled(enabled);
          isSoundEnabledRef.current = enabled;
        }

        const audio = new Audio('/notification.mp3');
        audio.preload = 'auto';
        audioObjRef.current = audio;
      } catch (e) {
        console.error('音效初始化失敗:', e);
      }
    }
  }, []);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // 僅在使用者實質操作手勢（點擊、觸控、按鍵）發生時才初始化 AudioContext，避免觸發瀏覽器 Autoplay 警告
  const initAudio = useCallback(() => {
    if (typeof window === 'undefined') return;
    hasUserGestureRef.current = true;
    try {
      if (!audioContextRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    } catch {
      // 靜默處理
    }
  }, []);

  // 🔔 全域點擊/觸控自動解鎖瀏覽器音效播放權限 (Autoplay Policy Unlock)
  useEffect(() => {
    const handleGesture = () => {
      initAudio();
      try {
        if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
          window.removeEventListener('click', handleGesture);
          window.removeEventListener('touchstart', handleGesture);
          window.removeEventListener('keydown', handleGesture);
        }
      } catch {}
    };

    try {
      if (typeof window !== 'undefined' && window && typeof window.addEventListener === 'function') {
        window.addEventListener('click', handleGesture, { passive: true, once: true });
        window.addEventListener('touchstart', handleGesture, { passive: true, once: true });
        window.addEventListener('keydown', handleGesture, { passive: true, once: true });
      }
    } catch {}

    return () => {
      try {
        if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
          window.removeEventListener('click', handleGesture);
          window.removeEventListener('touchstart', handleGesture);
          window.removeEventListener('keydown', handleGesture);
        }
      } catch {}
    };
  }, [initAudio]);

  const triggerBellOscillators = (ctx: AudioContext) => {
    try {
      const now = ctx.currentTime;

      // 叮 (Ding: 587.33Hz / D5 - 亮麗圓潤三角波)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // 咚 (Dong: 880.00Hz / A5 - 清脆正弦波)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.6, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.8);
    } catch {
      // 靜默處理
    }
  };

  const playSynthesizedChime = useCallback(() => {
    try {
      if (!hasUserGestureRef.current) return;
      initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => triggerBellOscillators(ctx)).catch(() => {});
      } else {
        triggerBellOscillators(ctx);
      }
    } catch {
      // 靜默處理
    }
  }, [initAudio]);

  const playChimeSound = useCallback(
    (force = false) => {
      if (!isSoundEnabledRef.current) return;

      // 🛡️ 嚴格防重放節流閥：若 2.5 秒內已發聲過且非強制試聽，絕不重複發聲
      const now = Date.now();
      if (!force && now - lastSoundPlayTimeRef.current < 2500) {
        return;
      }
      lastSoundPlayTimeRef.current = now;

      try {
        if (audioObjRef.current) {
          audioObjRef.current.currentTime = 0;
          const playPromise = audioObjRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // 只有在 MP3 播放受限時，才嘗試 Web Audio 合成音效
              playSynthesizedChime();
            });
          }
        } else {
          playSynthesizedChime();
        }
      } catch {
        playSynthesizedChime();
      }
    },
    [playSynthesizedChime]
  );

  const toggleSound = useCallback(() => {
    const next = !isSoundEnabledRef.current;
    setIsSoundEnabled(next);
    isSoundEnabledRef.current = next;
    try {
      localStorage.setItem('menu_app_admin_sound_enabled', String(next));
    } catch (e) {
      console.error(e);
    }
    if (next) {
      initAudio();
      playChimeSound(true);
    }
    return next;
  }, [initAudio, playChimeSound]);

  return {
    isSoundEnabled,
    playChimeSound,
    playNewOrderSound: playChimeSound,
    initAudio,
    toggleSound,
  };
}
