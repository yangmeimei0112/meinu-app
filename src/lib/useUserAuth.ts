'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  created_at: string;
}

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 初始化讀取 Auth 狀態並監聽變更
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          if (currentSession?.user) {
            const userMeta = currentSession.user.user_metadata || {};
            const userNickname = userMeta.nickname || currentSession.user.email?.split('@')[0] || '會員顧客';
            setProfile({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              nickname: userNickname,
              created_at: currentSession.user.created_at || new Date().toISOString(),
            });
            try {
              localStorage.setItem('menu_app_user_nickname', userNickname);
            } catch {}
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('初始化會員認證出錯:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        const userMeta = newSession.user.user_metadata || {};
        const userNickname = userMeta.nickname || newSession.user.email?.split('@')[0] || '會員顧客';
        setProfile({
          id: newSession.user.id,
          email: newSession.user.email || '',
          nickname: userNickname,
          created_at: newSession.user.created_at || new Date().toISOString(),
        });
        try {
          localStorage.setItem('menu_app_user_nickname', userNickname);
          window.dispatchEvent(new Event('storage'));
        } catch {}
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 1. 會員註冊
  const register = useCallback(async (email: string, password: string, nickname: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = nickname.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = '請輸入正確的電子信箱 (Email) 格式！';
      setAuthError(msg);
      return { success: false, error: msg };
    }
    if (!password || password.length < 6) {
      const msg = '密碼長度至少需要 6 個字元！';
      setAuthError(msg);
      return { success: false, error: msg };
    }
    if (!cleanNick) {
      const msg = '請填寫您的點餐暱稱！';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            nickname: cleanNick,
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('already registered')) {
          msg = '此電子信箱已被註冊，請直接登入！';
        } else if (msg.includes('Password should be')) {
          msg = '密碼強度不足，請使用至少 6 碼密碼';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }

      if (data.user) {
        try {
          localStorage.setItem('menu_app_user_nickname', cleanNick);
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      const msg = err?.message || '註冊失敗，請稍後重試';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 2. 會員登入
  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = '請輸入正確的電子信箱格式！';
      setAuthError(msg);
      return { success: false, error: msg };
    }
    if (!password) {
      const msg = '請輸入登入密碼！';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = '帳號或密碼錯誤，請重新確認！';
        } else if (msg.includes('Email not confirmed')) {
          msg = '請先至您的電子信箱點擊認證連結後再登入！';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }

      if (data.user) {
        const userMeta = data.user.user_metadata || {};
        const userNickname = userMeta.nickname || data.user.email?.split('@')[0] || '會員顧客';
        try {
          localStorage.setItem('menu_app_user_nickname', userNickname);
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      const msg = err?.message || '登入失敗，請稍後重試';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 3. 會員登出
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      return { success: true };
    } catch (err: any) {
      console.error('登出失敗:', err);
      return { success: false, error: err?.message };
    }
  }, []);

  // 4. 更新暱稱
  const updateNickname = useCallback(async (newNickname: string) => {
    const cleanNick = newNickname.trim();
    if (!cleanNick) return { success: false, error: '暱稱不能為空' };

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { nickname: cleanNick },
      });

      if (error) throw error;

      if (data.user) {
        setProfile((prev) => (prev ? { ...prev, nickname: cleanNick } : null));
        try {
          localStorage.setItem('menu_app_user_nickname', cleanNick);
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || '更新失敗' };
    }
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    authError,
    setAuthError,
    register,
    login,
    logout,
    updateNickname,
  };
}
