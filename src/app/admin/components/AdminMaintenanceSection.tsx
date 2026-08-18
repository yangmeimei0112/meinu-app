'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MaintenanceData, MaintenanceScreen } from '@/components/MaintenanceGuard';

const QUICK_REASONS = [
  '系統例行升級',
  '菜單規格重整',
  '效能優化更新',
  '金流維護升級',
  '資料庫同步維護',
];

interface AdminMaintenanceSectionProps {
  showToast: (msg: string) => void;
}

export function AdminMaintenanceSection({ showToast }: AdminMaintenanceSectionProps) {
  const [config, setConfig] = useState<MaintenanceData>({
    is_maintenance: false,
    title: '網站更新維護中，請稍後再下單',
    message: '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候。',
    estimated_end_time: '預計 15-30 分鐘內完成',
    reason: '系統例行升級',
    custom_image_url: '',
    updated_at: new Date().toISOString(),
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 載入當前伺服端維護設定
  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.error('載入維護設定失敗', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // 處理自訂圖片/GIF 上傳 (轉 Base64 Data URL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('⚠️ 圖片或 GIF 檔案建議小於 3MB，請重新選擇！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({ ...prev, custom_image_url: base64 }));
      showToast('📸 已選取自訂圖片/GIF，請點擊下方「儲存設定」生效！');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setConfig((prev) => ({ ...prev, custom_image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('🔄 已移除自訂圖片，恢復預設單齒輪旋轉動畫');
  };

  // 儲存維護設定至伺服端
  const handleSaveConfig = async (overrideState?: boolean) => {
    try {
      setSaving(true);
      const targetState = typeof overrideState === 'boolean' ? overrideState : config.is_maintenance;

      const payload = {
        ...config,
        is_maintenance: targetState,
      };

      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setConfig(json.config);
        showToast(json.message);
      } else {
        showToast(json.message || '儲存失敗');
      }
    } catch (e: any) {
      showToast('儲存維護設定發生錯誤：' + e?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !config.is_maintenance;
    await handleSaveConfig(nextState);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-12 text-center text-xs text-slate-400 animate-pulse border border-slate-100 dark:border-slate-800">
        正在載入系統維護控制設定...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頂部維護模式總開關狀態看板 */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border transition shadow-xs ${
          config.is_maintenance
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-400/40'
            : 'bg-white dark:bg-[#131B2B] border-slate-100 dark:border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                前台網站更新與維護控制台
              </h2>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  config.is_maintenance
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.is_maintenance ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
                <span>{config.is_maintenance ? '維護模式啟動中 (前台預警倒數與攔截)' : '正常營運中 (前台可自由點餐)'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              開啟維護模式時，前台使用中的訪客將收到「30 秒安全緩衝倒數預警廣播」，隨後切換至維護畫面。維護關閉後自動清除快取強同步 GitHub 最新發布版本。
            </p>
          </div>

          {/* 一鍵切換大按鈕 */}
          <button
            type="button"
            onClick={handleToggleMaintenance}
            disabled={saving}
            className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 ${
              config.is_maintenance
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <span>{config.is_maintenance ? '關閉維護 (恢復前台點餐)' : '開啟維護模式 (30秒預警並攔截)'}</span>
          </button>
        </div>
      </div>

      {/* 雙欄佈局：左側編輯設定，右側即時預覽效果 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：設定表單 */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131B2B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span>維護公告與自訂視覺設定</span>
          </h3>

          {/* 🖼️ 自訂圖片 / GIF 上傳區塊 */}
          <div className="space-y-2 bg-slate-50 dark:bg-[#182234] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                維護畫面中央插圖 (自訂照片 / GIF)
              </label>
              {config.custom_image_url && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                >
                  ✕ 移除並恢復預設齒輪
                </button>
              )}
            </div>

            {/* 建議尺寸與格式說明 */}
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium leading-relaxed">
              💡 建議上傳規格：比例 1:1 正方形（如 300×300 ~ 512×512 像素），支援 JPG、PNG、WebP 或動態 GIF，大小建議小於 2MB。未上傳時將預設顯示單一旋轉齒輪動畫。
            </p>

            {/* 上傳按鈕與預覽 */}
            <div className="flex items-center gap-3 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="maintenance-image-upload"
              />
              <label
                htmlFor="maintenance-image-upload"
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <span>📁 選擇檔案上傳</span>
              </label>

              {config.custom_image_url ? (
                <div className="flex items-center gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.custom_image_url}
                    alt="自訂圖片預覽"
                    className="w-9 h-9 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 shadow-2xs"
                  />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
                    已載入自訂圖片 (右側可預覽)
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  目前使用：預設單齒輪旋轉動畫
                </span>
              )}
            </div>
          </div>

          {/* 維護類型快速標籤 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              維護類型標籤 (快速填寫)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, reason: r }))}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                    config.reason === r
                      ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#182234] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 公告主標題 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              公告主標題
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="例如：網站更新維護中，請稍後再下單"
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 公告詳細訊息 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              詳細說明訊息
            </label>
            <textarea
              rows={3}
              value={config.message}
              onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="請詳細告知訪客暫停點餐的原因或預計等候時間..."
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 leading-relaxed"
            />
          </div>

          {/* 預計完成時間 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              預計完成時間 (選填)
            </label>
            <input
              type="text"
              value={config.estimated_end_time || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, estimated_end_time: e.target.value }))}
              placeholder="例如：預計 15-30 分鐘內完成 或 預計 15:00 恢復"
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 儲存按鈕 */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSaveConfig()}
              disabled={saving}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{saving ? '正在儲存設定...' : '儲存並即時更新前台維護公告'}</span>
            </button>
          </div>
        </div>

        {/* 右側：前台畫面即時預覽 */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131B2B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>前台維護畫面即時預覽</span>
            </h3>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : ''
                }`}
              >
                手機版
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : ''
                }`}
              >
                電腦版
              </button>
            </div>
          </div>

          {/* 預覽視窗容器 */}
          <div className="flex-1 flex items-center justify-center p-2">
            <div
              className={`w-full transition-all duration-200 overflow-hidden shadow-md rounded-3xl ${
                previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-full'
              }`}
            >
              <MaintenanceScreen data={config} isPreview={true} />
            </div>
          </div>

          <div className="text-center pt-2 text-[11px] text-slate-400">
            {config.custom_image_url
              ? '目前使用自訂上傳之圖片/GIF 動畫展示。'
              : '目前使用單一旋轉維修齒輪動畫預設展示。'}
          </div>
        </div>
      </div>
    </div>
  );
}
