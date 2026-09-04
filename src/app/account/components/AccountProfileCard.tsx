'use client';

import { useState } from 'react';
import { Crown, Mail, Calendar, Edit3, LogOut, Check, ArrowRight, Receipt, Moon, Sun, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/lib/useUserAuth';
import { getOrderHistoryCache } from '@/lib/storeMenuCache';

interface AccountProfileCardProps {
  profile: UserProfile;
  theme: string;
  toggleTheme: (e?: any) => void;
  onLogout: () => void;
  onUpdateNickname: (newNick: string) => Promise<{ success: boolean; error?: string }>;
}

export function AccountProfileCard({
  profile,
  theme,
  toggleTheme,
  onLogout,
  onUpdateNickname,
}: AccountProfileCardProps) {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(profile.nickname);
  const [isSaving, setIsSaving] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // 統計會員歷史訂單數據
  const cachedOrders = getOrderHistoryCache() || [];
  const totalOrders = cachedOrders.length;
  const totalSpent = cachedOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0);

  const handleSaveNickname = async () => {
    if (!newNickname.trim()) return;
    setIsSaving(true);
    const res = await onUpdateNickname(newNickname);
    setIsSaving(false);
    if (res.success) {
      setUpdateMsg('暱稱已更新！');
      setIsEditingNickname(false);
      setTimeout(() => setUpdateMsg(null), 2500);
    } else {
      setUpdateMsg(res.error || '更新失敗');
    }
  };

  const formattedDate = new Date(profile.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* 🌟 1. 尊榮會員卡片 (VIP Member Bento Glass Panel) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 dark:from-[#131B2B] dark:via-[#162136] dark:to-[#0E1524] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4">
        {/* 背景環境氛圍流光 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/15 dark:bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/15 dark:bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* 頂部會員標章與頭像 */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-black px-3 py-1 rounded-full border border-amber-500/30 shadow-2xs">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>咩nu 星級會員</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900/60 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出</span>
          </button>
        </div>

        {/* 會員頭像與名稱展示 */}
        <div className="flex items-center gap-3.5 text-left pt-1">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
            <div className="w-full h-full rounded-2xl bg-white dark:bg-[#0E1524] flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xl">
              {profile.nickname.slice(0, 1).toUpperCase() || 'M'}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-white dark:border-[#0E1524] rounded-full flex items-center justify-center text-[9px] text-white font-black shadow-xs">
              ★
            </span>
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  maxLength={20}
                  className="bg-white dark:bg-[#0B0F17] border border-sky-400 rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-hidden w-full max-w-[150px]"
                />
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveNickname}
                  className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  {profile.nickname}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingNickname(true)}
                  className="text-slate-400 hover:text-sky-500 transition p-1 cursor-pointer"
                  title="修改點餐暱稱"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>註冊於 {formattedDate}</span>
            </div>
          </div>
        </div>

        {updateMsg && (
          <p className="text-xs font-bold text-sky-600 dark:text-sky-400 animate-in fade-in">
            {updateMsg}
          </p>
        )}

        {/* 2. 會員數據統計儀表板 */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-center">
          <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
              <span>累計點餐訂單</span>
            </span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
              {totalOrders} <span className="text-xs font-bold text-slate-400">筆</span>
            </span>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-2xs">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              <span>歷史消費金額</span>
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              ${totalSpent} <span className="text-xs font-bold text-slate-400">元</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. 快速捷徑操作 */}
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 px-1">常用功能</p>
        <div className="space-y-1">
          {/* 主題切換 */}
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

          {/* 我的訂單 */}
          <Link
            href="/my-orders"
            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200 text-xs font-bold"
          >
            <span>查看我的所有歷史訂單</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          {/* 返回大廳 */}
          <Link
            href="/"
            className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-slate-700 dark:text-slate-200 text-xs font-bold"
          >
            <span>返回美食大廳選購餐點</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
