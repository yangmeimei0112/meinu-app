'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import MobileBottomNav from '@/components/MobileBottomNav';
import { User, Sparkles, Clock, ArrowRight, ShieldCheck, Heart, MapPin, Receipt, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function AccountPage() {
  const { theme, toggleTheme } = useTheme();
  const [savedNickname, setSavedNickname] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('menu_app_user_nickname') || '';
      setSavedNickname(stored);
    } catch {}
  }, []);

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
              我的帳戶
            </h1>
          </div>
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>預覽測試</span>
          </span>
        </div>

        {/* 🌟 核心測試提示 Bento 卡片 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/30 to-blue-50/40 dark:from-[#131B2B] dark:via-[#152033] dark:to-[#101726] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-4">
          {/* 背景環境氛圍光 */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* 懸浮頭像圖示 */}
          <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 p-1 shadow-lg shadow-sky-500/25 animate-in zoom-in-75 duration-300">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#0E1524] flex items-center justify-center text-sky-500 dark:text-sky-400">
              <User className="w-9 h-9" />
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-amber-500 border-2 border-white dark:border-[#0E1524] rounded-full flex items-center justify-center text-[9px] text-white font-black shadow-xs">
              🧪
            </span>
          </div>

          {/* 使用者預設暱稱展示 */}
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {savedNickname ? `嗨，${savedNickname}` : '親愛的顧客'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              歡迎使用 咩nu 揪團與美食訂餐平台
            </p>
          </div>

          {/* 🎯 使用者指定核心文字提示 */}
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-extrabold text-sm sm:text-base tracking-wide">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>此功能正在測試階段...</span>
            </div>
            <p className="text-[11px] text-amber-600/90 dark:text-amber-400/90 leading-relaxed font-medium">
              個人偏好設定、常用地址、收藏店家與專屬點數回饋功能正在全力開發測試中，敬請期待！
            </p>
          </div>

          {/* 預告功能清單展示 */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-left">
            <div className="bg-white/70 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">收藏店家</p>
                <p className="text-[10px] text-slate-400">即將推出</p>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">發票載具</p>
                <p className="text-[10px] text-slate-400">即將推出</p>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">常用地址</p>
                <p className="text-[10px] text-slate-400">即將推出</p>
              </div>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">安全登入</p>
                <p className="text-[10px] text-slate-400">即將推出</p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速捷徑操作 */}
        <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 px-1">常用功能</p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-500" />}
                <span>介面風格外觀</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {theme === 'dark' ? '深色暗黑模式' : '亮色清新模式'}
              </span>
            </button>
            <Link
              href="/my-orders"
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              <span>查看我的所有歷史訂單</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              <span>返回美食大廳選購餐點</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </main>

      {/* 底部導覽列 */}
      <MobileBottomNav />
    </div>
  );
}
