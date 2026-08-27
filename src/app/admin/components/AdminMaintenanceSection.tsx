'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MaintenanceData, MaintenanceScreen } from '@/components/MaintenanceGuard';
import { CheckCircle2, AlertTriangle, Settings, X, Lightbulb, Upload, Save, Smartphone } from 'lucide-react';

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
      showToast('圖片或 GIF 檔案建議小於 3MB，請重新選擇！');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({ ...prev, custom_image_url: base64 }));
      showToast('已選取自訂圖片/GIF，請點擊下方「儲存設定」生效！');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setConfig((prev) => ({ ...prev, custom_image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('已移除自訂圖片，恢復預設單齒輪旋轉動畫');
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
      <div className="bg-white/90 dark:bg-[#0E1726]/90 rounded-3xl p-12 text-center text-xs text-slate-400 animate-pulse border border-slate-200 dark:border-slate-800">
        正在載入系統維護控制設定...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 👑 頂部維護模式總開關狀態看板 (Maintenance Control Hero) */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-md ${
          config.is_maintenance
            ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-[#261B0E] dark:to-[#171008] border-amber-300 dark:border-amber-500/40 ring-2 ring-amber-400/30 shadow-amber-500/10'
            : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white dark:from-[#092215]/40 dark:via-[#0B1713] dark:to-[#08121A] border-emerald-200/80 dark:border-emerald-500/30'
        }`}
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            config.is_maintenance
              ? 'bg-gradient-to-b from-amber-400 to-orange-500'
              : 'bg-gradient-to-b from-emerald-400 to-teal-500'
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">
                前台網站更新與維護控制台
              </h2>
              <span
                className={`text-xs font-black px-3.5 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs ${
                  config.is_maintenance
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.is_maintenance ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
                <span>{config.is_maintenance ? '維護模式啟動中 (前台預警倒數與攔截)' : '正常營運中 (前台可自由點餐)'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed max-w-2xl">
              開啟維護模式時，前台訪客將收到「30 秒安全緩衝懸浮倒數預警」，隨後平滑切換至維護畫面。維護關閉後自動清除快取強同步 GitHub 最新發布版本。
            </p>
          </div>

          {/* 一鍵切換大按鈕 */}
          <button
            type="button"
            onClick={handleToggleMaintenance}
            disabled={saving}
            className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 ${
              config.is_maintenance
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25'
            }`}
          >
            {config.is_maintenance ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>關閉維護 (恢復前台點餐)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>開啟維護模式 (30秒預警並攔截)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 雙欄佈局：左側編輯設定，右側即時預覽效果 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左側：設定表單 (6 欄) */}
        <div className="lg:col-span-6 bg-white/95 dark:bg-[#0E1726]/95 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5 backdrop-blur-md">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Settings className="w-4 h-4 text-sky-500" />
            <span>維護公告與自訂視覺設定</span>
          </h3>

          {/* 自訂圖片 / GIF 上傳區塊 */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-[#152033] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                維護畫面中央插圖 (自訂照片 / GIF)
              </label>
              {config.custom_image_url && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-black cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>移除並恢復預設齒輪</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold leading-relaxed flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>建議規格：正方形 1:1（如 300×300 ~ 512×512 像素），支援 JPG、PNG、WebP 或動態 GIF。未上傳時將預設顯示單一旋轉齒輪動畫。</span>
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
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>選擇檔案上傳</span>
              </label>

              {config.custom_image_url ? (
                <div className="flex items-center gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.custom_image_url}
                    alt="自訂圖片預覽"
                    className="w-9 h-9 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 shadow-2xs"
                  />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black truncate">
                    已載入自訂圖片 (右側可預覽)
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-semibold">
                  目前使用：預設單齒輪旋轉動畫
                </span>
              )}
            </div>
          </div>

          {/* 維護類型快速標籤 */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              維護類型標籤 (點擊快速填寫)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, reason: r }))}
                  className={`text-xs font-black px-3 py-1 rounded-xl border transition cursor-pointer ${
                    config.reason === r
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 維護公告主標題 */}
          <div className="space-y-1.5">
            <label htmlFor="maint-title" className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              維護畫面主標題
            </label>
            <input
              id="maint-title"
              type="text"
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 預估維護時間 */}
          <div className="space-y-1.5">
            <label htmlFor="maint-time" className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              預計維護時間說明
            </label>
            <input
              id="maint-time"
              type="text"
              value={config.estimated_end_time}
              onChange={(e) => setConfig((prev) => ({ ...prev, estimated_end_time: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 詳細說明訊息 */}
          <div className="space-y-1.5">
            <label htmlFor="maint-msg" className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              維護說明訊息內容
            </label>
            <textarea
              id="maint-msg"
              rows={3}
              value={config.message}
              onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl py-2 px-3 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* 儲存設定按鈕 */}
          <button
            type="button"
            onClick={() => handleSaveConfig()}
            disabled={saving}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black py-2.5 rounded-2xl text-xs transition shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? '正在儲存中...' : '儲存維護公告設定'}</span>
          </button>
        </div>

        {/* 右側：即時效果預覽 (6 欄) */}
        <div className="lg:col-span-6 bg-white/95 dark:bg-[#0E1726]/95 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4 flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-500" />
              <span>前台即時效果預覽</span>
            </h3>

            {/* 設備切換按鈕 */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                手機直式
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                電腦寬螢幕
              </button>
            </div>
          </div>

          {/* 預覽畫面容器 */}
          <div className="flex-1 flex items-center justify-center p-2">
            <div
              className={`w-full transition-all duration-300 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-md bg-white dark:bg-[#080D1A] ${
                previewDevice === 'mobile' ? 'max-w-xs min-h-[440px]' : 'max-w-full min-h-[400px]'
              }`}
            >
              <MaintenanceScreen
                data={config}
                checking={false}
                isPreview={true}
                onCheckStatus={() => showToast('此為預覽畫面測試按鈕')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
