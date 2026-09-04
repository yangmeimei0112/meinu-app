'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MaintenanceData } from '@/components/MaintenanceGuard';
import { CheckCircle2, AlertTriangle, Settings } from 'lucide-react';
import { AdminMaintenanceForm } from './maintenance/AdminMaintenanceForm';
import { AdminMaintenancePreview } from './maintenance/AdminMaintenancePreview';

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

      if (res.ok) {
        setConfig((prev) => ({
          ...prev,
          is_maintenance: targetState,
          updated_at: json.config?.updated_at || new Date().toISOString(),
        }));
        showToast(json.message || (targetState ? '🚨 維護模式已啟動！' : '✅ 已關閉維護模式，網站已恢復正常點餐！'));
      } else {
        showToast(`儲存失敗：${json.message || json.error || '未知錯誤'}`);
      }
    } catch (e) {
      console.error('儲存維護設定失敗', e);
      showToast('儲存維護設定時發生錯誤');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-12 text-center text-xs text-slate-400 animate-pulse border border-slate-100 dark:border-slate-800">
        正在載入系統維護設定...
      </div>
    );
  }

  const activeScopes = config.scopes && config.scopes.length > 0 ? config.scopes : [config.scope || 'all'];
  const isFullSite = activeScopes.includes('all');

  return (
    <div className="space-y-6">
      {/* 頂部狀態說明條 */}
      <div
        className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
          config.is_maintenance
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
              config.is_maintenance
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}
          >
            {config.is_maintenance ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-black">
              {config.is_maintenance
                ? isFullSite
                  ? '全站維護模式進行中'
                  : `特定分頁維護進行中 (${activeScopes.length} 個分頁)`
                : '全站營運正常（未進入維護）'}
            </h3>
            <p className="text-[11px] opacity-80 mt-0.5">
              {config.is_maintenance
                ? isFullSite
                  ? '前台所有非管理員頁面目前皆處於全螢幕維護阻擋狀態'
                  : '僅阻擋已勾選之特定頁面，其他頁面開放正常瀏覽與點餐'
                : '前台開放所有使用者正常進入與送單點餐'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSaveConfig(!config.is_maintenance)}
          className={`text-xs font-black px-4 py-2.5 rounded-2xl transition shadow-xs active:scale-95 cursor-pointer ${
            config.is_maintenance
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {config.is_maintenance ? '結束維護並恢復營運' : '一鍵開啟維護模式'}
        </button>
      </div>

      {/* 雙欄主設定區：左側表單 + 右側即時預覽 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左側表單 */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131B2B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-500" />
              <span>廣播文字與圖文自訂</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              設定維護時向成員展示的說明標題、預計時間與自訂動態圖示
            </p>
          </div>

          <AdminMaintenanceForm
            config={config}
            setConfig={setConfig}
            saving={saving}
            fileInputRef={fileInputRef}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
            onSaveConfig={handleSaveConfig}
          />
        </div>

        {/* 右側即時預覽 */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131B2B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
          <AdminMaintenancePreview
            config={config}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
          />
        </div>
      </div>
    </div>
  );
}
