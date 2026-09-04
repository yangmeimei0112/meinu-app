'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  phone: string | null;
  created_at: string;
  provider?: string;
  avatar_url?: string | null;
}

export interface PasskeyItem {
  id: string;
  friendly_name: string;
  created_at: string;
  last_used_at?: string | null;
}

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 密碼重設狀態
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

  // Passkey 狀態
  const [isPasskeySupported, setIsPasskeySupported] = useState<boolean>(false);
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState<boolean>(false);

  // 偵測當前瀏覽器是否支援 WebAuthn Passkeys
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasWebAuthn =
        !!window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
      setIsPasskeySupported(hasWebAuthn);

      // 檢查 URL 參數是否處於重設密碼模式
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('mode') === 'reset-password' || window.location.hash.includes('type=recovery')) {
        setIsPasswordRecovery(true);
      }
    }
  }, []);

  // 取得使用者資料轉換輔助函式
  const extractProfile = useCallback((u: User): UserProfile => {
    const userMeta = u.user_metadata || {};
    const appMeta = u.app_metadata || {};
    const provider = appMeta.provider || (u.app_metadata?.providers?.[0]) || 'email';
    const nickname =
      userMeta.nickname ||
      userMeta.full_name ||
      userMeta.name ||
      u.email?.split('@')[0] ||
      '會員顧客';
    const phone = userMeta.phone || u.phone || null;
    const avatarUrl = userMeta.avatar_url || userMeta.picture || null;

    return {
      id: u.id,
      email: u.email || '',
      nickname,
      phone,
      created_at: u.created_at || new Date().toISOString(),
      provider,
      avatar_url: avatarUrl,
    };
  }, []);

  // 載入當前使用者的 Passkey 列表
  const fetchPasskeys = useCallback(async () => {
    if (!supabase.auth || !('passkey' in supabase.auth)) return;
    try {
      setLoadingPasskeys(true);
      const { data, error } = await (supabase.auth as any).passkey.list();
      if (!error && Array.isArray(data)) {
        setPasskeys(
          data.map((item: any) => ({
            id: item.id,
            friendly_name: item.friendly_name || item.name || '已綁定裝置',
            created_at: item.created_at || new Date().toISOString(),
            last_used_at: item.last_used_at,
          }))
        );
      }
    } catch (err) {
      console.warn('載入 Passkey 列表失敗 (可能尚未配置或未啟用):', err);
    } finally {
      setLoadingPasskeys(false);
    }
  }, []);

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
            const p = extractProfile(currentSession.user);
            setProfile(p);
            try {
              localStorage.setItem('menu_app_user_nickname', p.nickname);
              if (p.phone) localStorage.setItem('menu_app_user_phone', p.phone);
            } catch {}
            fetchPasskeys();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (newSession?.user) {
        const p = extractProfile(newSession.user);
        setProfile(p);
        try {
          localStorage.setItem('menu_app_user_nickname', p.nickname);
          if (p.phone) localStorage.setItem('menu_app_user_phone', p.phone);
          window.dispatchEvent(new Event('storage'));
        } catch {}
        fetchPasskeys();
      } else {
        setProfile(null);
        setPasskeys([]);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [extractProfile, fetchPasskeys]);

  // 1. 會員註冊 (Email + 密碼 + 選填手機)
  const register = useCallback(
    async (email: string, password: string, nickname: string, phone?: string) => {
      setAuthError(null);
      const cleanEmail = email.trim().toLowerCase();
      const cleanNick = nickname.trim();
      const cleanPhone = phone?.trim() || null;

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
              phone: cleanPhone,
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
            if (cleanPhone) localStorage.setItem('menu_app_user_phone', cleanPhone);
            window.dispatchEvent(new Event('storage'));
          } catch {}
        }

        return { success: true, user: data.user };
      } catch (err: any) {
        const msg = err?.message || '註冊失敗，請稍後重試';
        setAuthError(msg);
        return { success: false, error: msg };
      }
    },
    []
  );

  // 2. 會員密碼登入
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
          if (userMeta.phone) localStorage.setItem('menu_app_user_phone', userMeta.phone);
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

  // 3. Google OAuth 一鍵登入 / 註冊
  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      const msg = err?.message || 'Google 登入連線失敗';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 4. Passkey 生物辨識快速登入
  const loginWithPasskey = useCallback(async () => {
    setAuthError(null);
    try {
      if (!('signInWithPasskey' in supabase.auth)) {
        throw new Error('當前環境未支援 Passkey 驗證');
      }

      const { data, error } = await (supabase.auth as any).signInWithPasskey();
      if (error) {
        // 使用者取消或生物辨識未通過
        let msg = error.message;
        if (msg.includes('AbortError') || msg.includes('cancelled') || msg.includes('canceled')) {
          msg = '已取消生物辨識驗證';
        } else if (msg.includes('No passkeys found') || msg.includes('credential')) {
          msg = '找不到此裝置上的 Passkey，請先使用帳號密碼登入並綁定裝置！';
        }
        setAuthError(msg);
        return { success: false, error: msg };
      }

      return { success: true, user: data?.user };
    } catch (err: any) {
      const msg = err?.message || 'Passkey 登入失敗';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 5. 綁定此裝置之 Passkey
  const registerPasskey = useCallback(async (friendlyName?: string) => {
    setAuthError(null);
    try {
      if (!('registerPasskey' in supabase.auth)) {
        throw new Error('當前環境尚未啟用 Passkey 功能');
      }

      const defaultName =
        friendlyName?.trim() ||
        (typeof navigator !== 'undefined'
          ? /iPhone|iPad|iPod/.test(navigator.userAgent)
            ? 'Apple 裝置 (Face ID / Touch ID)'
            : /Android/.test(navigator.userAgent)
            ? 'Android 裝置 (指紋/臉部辨識)'
            : /Macintosh/.test(navigator.userAgent)
            ? 'Mac 裝置 (Touch ID)'
            : /Windows/.test(navigator.userAgent)
            ? 'Windows 裝置 (Windows Hello)'
            : '我的安全金鑰'
          : '個人安全裝置');

      const { data, error } = await (supabase.auth as any).registerPasskey({
        name: defaultName,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('AbortError') || msg.includes('cancelled') || msg.includes('canceled')) {
          msg = '已取消綁定生物辨識裝置';
        }
        return { success: false, error: msg };
      }

      await fetchPasskeys();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Passkey 綁定失敗' };
    }
  }, [fetchPasskeys]);

  // 6. 刪除指定的 Passkey
  const deletePasskey = useCallback(async (passkeyId: string) => {
    try {
      const { error } = await (supabase.auth as any).passkey.delete({ passkeyId });
      if (error) throw error;
      setPasskeys((prev) => prev.filter((p) => p.id !== passkeyId));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || '刪除金鑰失敗' };
    }
  }, []);

  // 7. 發送忘記密碼重設信件
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const msg = '請輸入正確的電子信箱！';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/account?mode=reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || '發送重設密碼信件失敗';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 8. 重設新密碼
  const resetPassword = useCallback(async (newPassword: string) => {
    setAuthError(null);
    if (!newPassword || newPassword.length < 6) {
      const msg = '新密碼長度至少需要 6 個字元！';
      setAuthError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      setIsPasswordRecovery(false);
      return { success: true, user: data.user };
    } catch (err: any) {
      const msg = err?.message || '密碼重設失敗，請稍後重試';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // 9. 更新暱稱
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

  // 10. 更新手機號碼
  const updatePhone = useCallback(async (newPhone: string) => {
    const cleanPhone = newPhone.trim();

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { phone: cleanPhone || null },
      });

      if (error) throw error;

      if (data.user) {
        setProfile((prev) => (prev ? { ...prev, phone: cleanPhone || null } : null));
        try {
          if (cleanPhone) {
            localStorage.setItem('menu_app_user_phone', cleanPhone);
          } else {
            localStorage.removeItem('menu_app_user_phone');
          }
          window.dispatchEvent(new Event('storage'));
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || '更新手機號碼失敗' };
    }
  }, []);

  // 11. 會員登出
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setPasskeys([]);
      return { success: true };
    } catch (err: any) {
      console.error('登出失敗:', err);
      return { success: false, error: err?.message };
    }
  }, []);

  // 12. 註銷帳號 (Account Deletion)
  const deleteAccount = useCallback(async () => {
    try {
      const { data: { session: currSession } } = await supabase.auth.getSession();
      const token = currSession?.access_token;

      if (token) {
        await fetch('/api/account/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // 清除本機所有快取
      try {
        localStorage.removeItem('menu_app_user_nickname');
        localStorage.removeItem('menu_app_user_phone');
        localStorage.removeItem('menu_app_orders');
        window.dispatchEvent(new Event('storage'));
      } catch {}

      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setPasskeys([]);

      return { success: true };
    } catch (err: any) {
      console.error('註銷帳號出錯:', err);
      return { success: false, error: err?.message || '註銷失敗' };
    }
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    authError,
    setAuthError,
    isPasswordRecovery,
    setIsPasswordRecovery,
    isPasskeySupported,
    passkeys,
    loadingPasskeys,
    register,
    login,
    loginWithGoogle,
    loginWithPasskey,
    registerPasskey,
    fetchPasskeys,
    deletePasskey,
    sendPasswordResetEmail,
    resetPassword,
    updateNickname,
    updatePhone,
    logout,
    deleteAccount,
  };
}
