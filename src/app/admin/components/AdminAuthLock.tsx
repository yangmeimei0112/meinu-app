'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { generateMathChallenge, getLockoutDurationSec } from '@/lib/security';

interface AdminAuthLockProps {
  onUnlockSuccess: () => void;
  onInitAudio: () => void;
}

export default function AdminAuthLock({ onUnlockSuccess, onInitAudio }: AdminAuthLockProps) {
  const [passcode, setPasscode] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [captchaChallenge, setCaptchaChallenge] = useState<{ question: string; answer: number }>(() =>
    generateMathChallenge()
  );
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    const rawLockout =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('menu_app_admin_lockout') || localStorage.getItem('menu_app_admin_lockout')
        : null;
    if (rawLockout) {
      const lockUntil = Number(rawLockout);
      const diff = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      if (diff > 0) setLockoutRemaining(diff);
    }
  }, []);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem('menu_app_admin_lockout');
            localStorage.removeItem('menu_app_admin_lockout');
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // 🛡️ 伺服端 Session 自動恢復檢驗
  useEffect(() => {
    fetch('/api/admin/verify')
      .then((res) => {
        if (res.ok) {
          onUnlockSuccess();
          onInitAudio();
        }
      })
      .catch(() => {});
  }, [onUnlockSuccess, onInitAudio]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;

    if (lockoutRemaining > 0) {
      alert(`🔒 系統處於防撞庫安全鎖定中，請於 ${lockoutRemaining} 秒後再試！`);
      return;
    }

    // 當錯誤次數 >= 2 時強制驗證動態人機挑戰
    if (failedAttempts >= 2) {
      if (!captchaInput.trim() || Number(captchaInput.trim()) !== captchaChallenge.answer) {
        alert('⚠️ 人機驗證算術答案錯誤！請重新計算輸入。');
        setCaptchaChallenge(generateMathChallenge());
        setCaptchaInput('');
        return;
      }
    }

    setIsVerifying(true);

    try {
      // 🛡️ 透過伺服端 API 進行時序安全與環境變數密碼驗證
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onUnlockSuccess();
        setFailedAttempts(0);
        setCaptchaInput('');
        onInitAudio();
        try {
          sessionStorage.removeItem('menu_app_admin_failed');
          sessionStorage.removeItem('menu_app_admin_lockout');
          localStorage.removeItem('menu_app_admin_lockout');
        } catch {}
      } else {
        const nextFail = failedAttempts + 1;
        setFailedAttempts(nextFail);
        setCaptchaChallenge(generateMathChallenge());
        setCaptchaInput('');

        const lockSec = data.lockedUntilSec || getLockoutDurationSec(nextFail);
        if (lockSec > 0) {
          const lockUntil = Date.now() + lockSec * 1000;
          try {
            sessionStorage.setItem('menu_app_admin_lockout', String(lockUntil));
            localStorage.setItem('menu_app_admin_lockout', String(lockUntil));
          } catch {}
          setLockoutRemaining(lockSec);
        }

        alert(data.message || '❌ 密碼錯誤！');
      }
    } catch (err) {
      console.error(err);
      alert('連線伺服器驗證失敗，請檢查網路連線');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] flex flex-col justify-between transition-colors duration-200">
      <OfflineBanner />
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131B2B] border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm w-full max-w-sm text-center space-y-4">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">「咩nu」團長管理後台</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">請輸入團長密碼解鎖權限</p>
          </div>

          {lockoutRemaining > 0 ? (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 text-center space-y-1">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">🔒 密碼錯誤次數過多</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                系統防撞庫鎖定中，請於 <span className="font-bold font-mono">{lockoutRemaining}</span> 秒後再試
              </p>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-3 pt-2">
              <label htmlFor="admin-passcode-input" className="sr-only">
                團長後台解鎖密碼
              </label>
              <input
                id="admin-passcode-input"
                name="adminPasscode"
                type="password"
                aria-label="團長後台密碼"
                placeholder="輸入密碼 (預設：8888)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={isVerifying}
                className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
              />

              {/* 🛡️ 撞庫防護：連續錯誤 2 次以上啟動動態人機挑戰 */}
              {failedAttempts >= 2 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3 text-left space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    <span>🤖 人機驗證安全挑戰：</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCaptchaChallenge(generateMathChallenge());
                        setCaptchaInput('');
                      }}
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 underline text-[10px] cursor-pointer"
                    >
                      🔄 換一題
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 font-mono font-extrabold text-amber-900 dark:text-amber-300 text-sm tracking-wider shadow-xs">
                      {captchaChallenge.question}
                    </span>
                    <label htmlFor="admin-captcha-input" className="sr-only">
                      人機驗證答案
                    </label>
                    <input
                      id="admin-captcha-input"
                      name="captchaAnswer"
                      type="number"
                      aria-label="人機驗證答案"
                      placeholder="請填答案"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      disabled={isVerifying}
                      className="flex-1 bg-white dark:bg-[#182234] border border-amber-200 dark:border-amber-900/60 rounded-xl py-1.5 px-3 text-center text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-3 rounded-2xl text-sm transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    安全校驗中...
                  </>
                ) : (
                  '解鎖進入後台 ➔'
                )}
              </button>
            </form>
          )}
        </div>
      </main>
      <div />
    </div>
  );
}
