'use client';

import { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AccountAuthFormProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (email: string, pass: string, nick: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  onLoginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  onLoginWithPasskey: () => Promise<{ success: boolean; error?: string }>;
  onSendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  onResetPassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  isPasswordRecovery?: boolean;
  isPasskeySupported?: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

export function AccountAuthForm({
  onLogin,
  onRegister,
  onLoginWithGoogle,
  onLoginWithPasskey,
  onSendPasswordResetEmail,
  onResetPassword,
  isPasswordRecovery = false,
  isPasskeySupported = false,
  authError,
  setAuthError,
}: AccountAuthFormProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset'>(
    isPasswordRecovery ? 'reset' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 處理 Email 密碼登入 / 註冊 / 忘記密碼 / 重設密碼表單送出
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    if (tab === 'register') {
      if (password !== confirmPassword) {
        setAuthError('兩次輸入的密碼不一致，請重新檢查！');
        return;
      }
      if (!nickname.trim()) {
        setAuthError('請填寫點餐暱稱！');
        return;
      }
      setIsSubmitting(true);
      const res = await onRegister(email, password, nickname, phone);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg('🎉 註冊成功！已自動為您登入並同步暱稱。');
      }
    } else if (tab === 'forgot') {
      if (!email.trim()) {
        setAuthError('請輸入註冊時的電子信箱！');
        return;
      }
      setIsSubmitting(true);
      const res = await onSendPasswordResetEmail(email);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg('📩 重設密碼郵件已寄出！請至您的信箱收取並點擊連結重設密碼。');
      }
    } else if (tab === 'reset') {
      if (password !== confirmPassword) {
        setAuthError('兩次輸入的新密碼不一致！');
        return;
      }
      if (password.length < 6) {
        setAuthError('新密碼長度至少需要 6 個字元！');
        return;
      }
      setIsSubmitting(true);
      const res = await onResetPassword(password);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg('🎉 密碼已成功更新！正在為您同步會員狀態...');
      }
    } else {
      setIsSubmitting(true);
      const res = await onLogin(email, password);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg('🎉 歡迎回來！登入成功。');
      }
    }
  };

  // 處理 Google 一鍵登入
  const handleGoogleAuth = async () => {
    setAuthError(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    const res = await onLoginWithGoogle();
    setIsGoogleLoading(false);
    if (!res.success && res.error) {
      setAuthError(res.error);
    }
  };

  // 處理 Passkey 生物辨識登入
  const handlePasskeyAuth = async () => {
    setAuthError(null);
    setSuccessMsg(null);
    setIsPasskeyLoading(true);
    const res = await onLoginWithPasskey();
    setIsPasskeyLoading(false);
    if (res.success) {
      setSuccessMsg('🎉 生物辨識驗證成功！歡迎登入。');
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
      {/* 頂部 Tab 切換列 (當處於忘記/重設密碼時提供返回) */}
      {tab === 'forgot' || tab === 'reset' ? (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="text-sm font-black text-slate-800 dark:text-slate-100">
              {tab === 'forgot' ? '忘記密碼' : '設定新密碼'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setAuthError(null);
              setSuccessMsg(null);
            }}
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
          >
            返回登入
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-black select-none">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setAuthError(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>登入會員</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setAuthError(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>註冊新帳號</span>
          </button>
        </div>
      )}

      {/* 標題與簡介 */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {tab === 'login'
            ? '歡迎登入 咩nu 會員'
            : tab === 'register'
            ? '加入 咩nu 享受極速點餐'
            : tab === 'forgot'
            ? '找回您的會員密碼'
            : '重設您的會員密碼'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {tab === 'login'
            ? '登入後可自動代入點餐暱稱與歷史收藏'
            : tab === 'register'
            ? '建立專屬帳號，享受個人化點餐體驗'
            : tab === 'forgot'
            ? '輸入您的註冊信箱，我們將寄送重設驗證連結給您'
            : '請輸入您要設定的新密碼'}
        </p>
      </div>

      {/* 快速登入捷徑（Passkey 與 Google OAuth）- 僅在登入與註冊頁面顯示 */}
      {(tab === 'login' || tab === 'register') && (
        <div className="space-y-2.5 pt-1">
          {/* 1. Passkey 生物辨識登入按鈕 (若裝置支援) */}
          {isPasskeySupported && (
            <button
              type="button"
              onClick={handlePasskeyAuth}
              disabled={isPasskeyLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isPasskeyLoading ? '正在啟動生物辨識...' : '使用 Passkey / 指紋臉部快速登入'}</span>
            </button>
          )}

          {/* 2. Google OAuth 一鍵登入按鈕 */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {/* Google SVG Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? '正在連接 Google...' : '透過 Google 帳號繼續'}</span>
          </button>

          {/* 分隔線 */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">或使用電子信箱</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      )}

      {/* 提示訊息 */}
      {authError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-bold leading-relaxed">{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-bold leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* 表單內容 */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 註冊特有：暱稱 */}
        {tab === 'register' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>點餐暱稱</span>
              <span className="text-[10px] text-amber-500 font-normal">必填，將顯示於團長訂單</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：王小明 / Alice"
                maxLength={20}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>
          </div>
        )}

        {/* 註冊特有：手機號碼（選填） */}
        {tab === 'register' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>聯絡電話</span>
              <span className="text-[10px] text-slate-400 font-normal">選填，方便外送抵達聯絡</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="例如：0912345678"
                maxLength={15}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>
          </div>
        )}

        {/* 電子信箱 (在非重設密碼模式下顯示) */}
        {tab !== 'reset' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">電子信箱 (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>
          </div>
        )}

        {/* 密碼 (在登入、註冊、重設密碼模式下顯示) */}
        {tab !== 'forgot' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tab === 'reset' ? '新密碼' : '登入密碼'}
              </label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setAuthError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  忘記密碼？
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 個字元"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* 確認密碼 (註冊或重設密碼模式) */}
        {(tab === 'register' || tab === 'reset') && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">確認密碼</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="請再次輸入密碼"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 transition"
              />
            </div>
          </div>
        )}

        {/* 提交主按鈕 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>處理中...</span>
            </>
          ) : tab === 'login' ? (
            <>
              <LogIn className="w-4 h-4" />
              <span>登入會員</span>
            </>
          ) : tab === 'register' ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>註冊帳號並登入</span>
            </>
          ) : tab === 'forgot' ? (
            <>
              <Mail className="w-4 h-4" />
              <span>發送重設密碼信件</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>確認重設新密碼</span>
            </>
          )}
        </button>
      </form>

      {/* 底部小提示 */}
      <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
        點擊登入或註冊即表示您同意咩nu的服務協議與隱私政策
      </p>
    </div>
  );
}
