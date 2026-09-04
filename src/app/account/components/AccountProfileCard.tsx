'use client';

import { useState } from 'react';
import {
  Crown,
  Mail,
  Phone,
  Calendar,
  Edit3,
  LogOut,
  Check,
  X,
  ArrowRight,
  Receipt,
  Moon,
  Sun,
  ShoppingBag,
  Fingerprint,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { UserProfile, PasskeyItem } from '@/lib/useUserAuth';
import { getOrderHistoryCache } from '@/lib/storeMenuCache';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';

interface AccountProfileCardProps {
  profile: UserProfile;
  theme: string;
  toggleTheme: (e?: any) => void;
  onLogout: () => void;
  onUpdateNickname: (newNick: string) => Promise<{ success: boolean; error?: string }>;
  onUpdatePhone: (newPhone: string) => Promise<{ success: boolean; error?: string }>;
  isPasskeySupported: boolean;
  passkeys: PasskeyItem[];
  loadingPasskeys: boolean;
  onRegisterPasskey: (name?: string) => Promise<{ success: boolean; error?: string }>;
  onDeletePasskey: (id: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export function AccountProfileCard({
  profile,
  theme,
  toggleTheme,
  onLogout,
  onUpdateNickname,
  onUpdatePhone,
  isPasskeySupported,
  passkeys,
  loadingPasskeys,
  onRegisterPasskey,
  onDeletePasskey,
  onDeleteAccount,
}: AccountProfileCardProps) {
  // 暱稱編輯狀態
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(profile.nickname);
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // 手機號碼編輯狀態
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(profile.phone || '');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // Passkey 註冊與刪除狀態
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);

  // 註銷帳號二次確認彈窗
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // 提示訊息
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 統計會員歷史訂單數據
  const cachedOrders = getOrderHistoryCache() || [];
  const totalOrders = cachedOrders.length;
  const totalSpent = cachedOrders.reduce((sum, o) => sum + (o.final_amount || 0), 0);

  // 儲存暱稱
  const handleSaveNickname = async () => {
    if (!newNickname.trim()) return;
    setIsSavingNickname(true);
    const res = await onUpdateNickname(newNickname);
    setIsSavingNickname(false);
    if (res.success) {
      showToast('🎉 點餐暱稱已成功更新！');
      setIsEditingNickname(false);
    } else {
      showToast(res.error || '更新暱稱失敗');
    }
  };

  // 儲存手機號碼
  const handleSavePhone = async () => {
    setIsSavingPhone(true);
    const res = await onUpdatePhone(newPhone);
    setIsSavingPhone(false);
    if (res.success) {
      showToast(newPhone.trim() ? '📱 聯絡手機已成功更新！' : '已清除聯絡手機');
      setIsEditingPhone(false);
    } else {
      showToast(res.error || '更新手機失敗');
    }
  };

  // 註冊當前裝置 Passkey
  const handleAddPasskey = async () => {
    setIsRegisteringPasskey(true);
    const res = await onRegisterPasskey();
    setIsRegisteringPasskey(false);
    if (res.success) {
      showToast('🛡️ 已成功為此裝置綁定 Passkey 生物辨識！');
    } else {
      showToast(res.error || '綁定 Passkey 失敗');
    }
  };

  // 刪除 Passkey
  const handleDeletePasskey = async (id: string) => {
    setDeletingPasskeyId(id);
    const res = await onDeletePasskey(id);
    setDeletingPasskeyId(null);
    if (res.success) {
      showToast('已解除此裝置 Passkey 金鑰');
    } else {
      showToast(res.error || '刪除失敗');
    }
  };

  // 執行註銷帳號
  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    const res = await onDeleteAccount();
    setIsDeletingAccount(false);
    setShowDeleteConfirm(false);
    if (res.success) {
      showToast('會員帳號已成功註銷');
    } else {
      showToast(res.error || '註銷帳號失敗');
    }
  };

  const formattedDate = new Date(profile.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isGoogleUser = profile.provider === 'google';

  return (
    <div className="space-y-4">
      {/* 浮動 Toast 提示 */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          {toastMsg}
        </div>
      )}

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
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 p-0.5 shadow-lg shadow-sky-500/20 shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-white dark:bg-[#0E1524] flex items-center justify-center text-sky-600 dark:text-sky-400 font-black text-xl">
                {profile.nickname.slice(0, 1).toUpperCase() || 'M'}
              </div>
            )}
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
                  onClick={handleSaveNickname}
                  disabled={isSavingNickname}
                  className="p-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 cursor-pointer disabled:opacity-50"
                  title="儲存暱稱"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingNickname(false);
                    setNewNickname(profile.nickname);
                  }}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                  title="取消"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
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

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </span>

              {isGoogleUser ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <span>Google 認證</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span>Email 認證</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 手機號碼管理列 */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">聯絡手機：</span>
            {isEditingPhone ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0912345678"
                  maxLength={15}
                  className="bg-white dark:bg-[#0B0F17] border border-sky-400 rounded-lg px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 font-bold focus:outline-hidden w-28"
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={isSavingPhone}
                  className="p-1 rounded-md bg-sky-500 text-white hover:bg-sky-600 cursor-pointer disabled:opacity-50"
                  title="儲存手機"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPhone(false);
                    setNewPhone(profile.phone || '');
                  }}
                  className="p-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                  title="取消"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                {profile.phone || '尚未設定'}
              </span>
            )}
          </div>

          {!isEditingPhone && (
            <button
              type="button"
              onClick={() => setIsEditingPhone(true)}
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>{profile.phone ? '變更號碼' : '綁定號碼'}</span>
            </button>
          )}
        </div>

        {/* 底部加入日期 */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            註冊加入於 {formattedDate}
          </span>
          <span className="text-emerald-500 font-bold">● 帳號狀態正常</span>
        </div>
      </div>

      {/* 🛡️ 2. Passkey 生物辨識安全鎖 (WebAuthn 設定專區 - 自由選擇開啟) */}
      <div className="bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-2xl rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>Passkey 生物辨識安全鎖</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                  WebAuthn
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                使用 Face ID、Touch ID 或 Windows Hello 免輸密碼 1 秒登入
              </p>
            </div>
          </div>

          {isPasskeySupported && (
            <button
              type="button"
              onClick={handleAddPasskey}
              disabled={isRegisteringPasskey}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isRegisteringPasskey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>正在驗證...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>綁定此裝置</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 已綁定之 Passkey 列表 */}
        {loadingPasskeys ? (
          <div className="text-center py-3 text-xs text-slate-400">正在讀取已綁定裝置...</div>
        ) : passkeys.length > 0 ? (
          <div className="space-y-2 pt-1">
            {passkeys.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{p.friendly_name}</div>
                    <div className="text-[10px] text-slate-400">
                      綁定於 {new Date(p.created_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePasskey(p.id)}
                  disabled={deletingPasskeyId === p.id}
                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition cursor-pointer disabled:opacity-50"
                  title="解除此 Passkey"
                >
                  {deletingPasskeyId === p.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            {isPasskeySupported
              ? '您尚未綁定任何生物辨識裝置，點擊上方按鈕即可快速啟用！'
              : '此瀏覽器環境未支援 WebAuthn 生物辨識'}
          </div>
        )}
      </div>

      {/* 📊 3. 個人點餐數據看板 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-2xl rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
            <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
            <span>累積點餐</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalOrders} <span className="text-xs font-bold text-slate-400">次</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-2xl rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
            <Receipt className="w-3.5 h-3.5 text-emerald-500" />
            <span>累積消費</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ${totalSpent} <span className="text-xs font-bold text-slate-400">元</span>
          </div>
        </div>
      </div>

      {/* 🔗 4. 快捷功能導覽 */}
      <div className="bg-white/90 dark:bg-[#131B2B]/90 backdrop-blur-2xl rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
        <Link
          href="/my-orders"
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-110 transition">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">查看我的歷史訂單</div>
              <div className="text-[10px] text-slate-400">追蹤過往點餐紀錄與收據</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        {/* 外觀深淺主題切換 */}
        <div className="flex items-center justify-between p-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">外觀模式</div>
              <div className="text-[10px] text-slate-400">
                {theme === 'dark' ? '深色夜間模式' : '亮色日間模式'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            {theme === 'dark' ? '切換日間' : '切換夜間'}
          </button>
        </div>
      </div>

      {/* 🚨 5. 危險區域 (Danger Zone - 註銷帳號) */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-5 border border-rose-200/80 dark:border-rose-900/40 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <h4 className="text-xs font-black text-rose-700 dark:text-rose-400">帳號進階安全設定</h4>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          若您不再使用此帳號，可選擇註銷帳號。註銷後將永久移除您的個人設定與登入身分，本機歷史紀錄亦將一併抹除。
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300/60 dark:border-rose-800 font-extrabold text-xs transition cursor-pointer"
        >
          註銷會員帳號
        </button>
      </div>

      {/* 註銷帳號安全二次確認彈窗 */}
      <DoubleConfirmModal
        isOpen={showDeleteConfirm}
        title="⚠️ 確認註銷您的會員帳號？"
        message="註銷後，您的帳號身分、點餐暱稱、手機號碼與已綁定之 Passkey 將全部刪除並登出，此操作無法復原。請問確定要繼續嗎？"
        confirmText={isDeletingAccount ? '正在註銷...' : '確認註銷'}
        cancelText="取消返回"
        isDanger={true}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
