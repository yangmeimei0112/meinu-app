'use client';

import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import MobileBottomNav from '@/components/MobileBottomNav';
import { User, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useUserAuth } from '@/lib/useUserAuth';
import { AccountAuthForm } from './components/AccountAuthForm';
import { AccountProfileCard } from './components/AccountProfileCard';

export default function AccountPage() {
  const { theme, toggleTheme } = useTheme();
  const {
    profile,
    loading,
    authError,
    setAuthError,
    isPasswordRecovery,
    isPasskeySupported,
    passkeys,
    loadingPasskeys,
    register,
    login,
    loginWithGoogle,
    loginWithPasskey,
    registerPasskey,
    deletePasskey,
    sendPasswordResetEmail,
    resetPassword,
    updateNickname,
    updatePhone,
    logout,
    deleteAccount,
  } = useUserAuth();

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      <OfflineBanner />
      <Header />

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* 頂部標題 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              會員專區
            </h1>
          </div>
          <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{profile ? '已登入' : '訪客模式'}</span>
          </span>
        </div>

        {loading ? (
          <div className="bg-white/80 dark:bg-[#131B2B]/80 rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2 border border-slate-100 dark:border-slate-800">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-500" />
            <p>正在同步會員帳號資料...</p>
          </div>
        ) : profile && !isPasswordRecovery ? (
          <AccountProfileCard
            profile={profile}
            theme={theme}
            toggleTheme={toggleTheme}
            onLogout={logout}
            onUpdateNickname={updateNickname}
            onUpdatePhone={updatePhone}
            isPasskeySupported={isPasskeySupported}
            passkeys={passkeys}
            loadingPasskeys={loadingPasskeys}
            onRegisterPasskey={registerPasskey}
            onDeletePasskey={deletePasskey}
            onDeleteAccount={deleteAccount}
          />
        ) : (
          <AccountAuthForm
            onLogin={login}
            onRegister={register}
            onLoginWithGoogle={loginWithGoogle}
            onLoginWithPasskey={loginWithPasskey}
            onSendPasswordResetEmail={sendPasswordResetEmail}
            onResetPassword={resetPassword}
            isPasswordRecovery={isPasswordRecovery}
            isPasskeySupported={isPasskeySupported}
            authError={authError}
            setAuthError={setAuthError}
          />
        )}
      </main>

      {/* 底部導覽列 */}
      <MobileBottomNav />
    </div>
  );
}
