'use client';

import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AccountAuthFormProps {
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (email: string, pass: string, nick: string) => Promise<{ success: boolean; error?: string }>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

export function AccountAuthForm({
  onLogin,
  onRegister,
  authError,
  setAuthError,
}: AccountAuthFormProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      const res = await onRegister(email, password, nickname);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMsg('🎉 註冊成功！已自動為您登入並同步暱稱。');
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

  return (
    <div className="bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
      {/* 頂部 Tab 切換列 */}
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

      {/* 標題與簡介 */}
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {tab === 'login' ? '歡迎登入 咩nu 會員' : '加入 咩nu 享受極速點餐'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {tab === 'login'
            ? '登入後可自動帶入點餐暱稱並記錄您的所有點餐歷史'
            : '只需填寫暱稱與信箱，10 秒快速完成免費註冊'}
        </p>
      </div>

      {/* 成功 / 錯誤提示訊息 */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {authError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 p-3 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* 認證表單 */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 註冊特有：點餐暱稱 */}
        {tab === 'register' && (
          <div className="space-y-1 text-left">
            <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-sky-500" />
              <span>點餐暱稱 (結帳時自動帶入)</span>
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例如：小明、辦公室小羊"
              maxLength={20}
              className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>
        )}

        {/* 電子信箱 */}
        <div className="space-y-1 text-left">
          <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-sky-500" />
            <span>電子信箱 (Email)</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition"
          />
        </div>

        {/* 密碼 */}
        <div className="space-y-1 text-left">
          <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-sky-500" />
            <span>密碼 (至少 6 碼)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-700 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 註冊特有：確認密碼 */}
        {tab === 'register' && (
          <div className="space-y-1 text-left">
            <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-sky-500" />
              <span>確認密碼</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次輸入相同密碼"
              autoComplete="new-password"
              className="w-full bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>
        )}

        {/* 提交按鈕 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:brightness-110 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg shadow-sky-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 pt-3"
        >
          {isSubmitting ? (
            <span>處理中，請稍候...</span>
          ) : tab === 'login' ? (
            <>
              <LogIn className="w-4 h-4" />
              <span>立即登入會員</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>免費註冊新帳號</span>
            </>
          )}
        </button>
      </form>

      {/* 訪客模式友好提示 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          若不想註冊，您仍可隨時以訪客身分自由點餐結帳
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline mt-1.5 transition"
        >
          <span>先去大廳看看有什麼好吃的</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
