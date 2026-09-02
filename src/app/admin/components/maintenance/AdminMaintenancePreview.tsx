'use client';

import React, { useState, useEffect } from 'react';
import { MaintenanceData, MaintenanceScreen } from '@/components/MaintenanceGuard';
import { Smartphone, Monitor, Maximize2, X, AlertTriangle, Home, Search, ShoppingCart, ClipboardList } from 'lucide-react';

interface AdminMaintenancePreviewProps {
  config: MaintenanceData;
  previewDevice: 'mobile' | 'desktop';
  setPreviewDevice: (device: 'mobile' | 'desktop') => void;
}

// 📱 模擬底部導覽列（供單頁維護即時預覽）
function SimulatedBottomNav({ scope }: { scope?: string }) {
  const navItems = [
    { id: 'home', label: '美食大廳', icon: Home, inMaint: scope === 'home' || scope === 'all' },
    { id: 'search', label: '搜尋探索', icon: Search, inMaint: scope === 'search' || scope === 'all' },
    { id: 'cart', label: '購物車', icon: ShoppingCart, inMaint: scope === 'cart' || scope === 'checkout' || scope === 'all' },
    { id: 'orders', label: '我的訂單', icon: ClipboardList, inMaint: scope === 'my-orders' || scope === 'all' },
  ];

  return (
    <div className="absolute bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/80 shadow-lg px-2 flex items-center justify-around h-14 select-none pointer-events-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="relative flex flex-col items-center justify-center flex-1 h-full py-1">
            <div className="relative flex items-center justify-center">
              <Icon className={`w-4 h-4 ${item.inMaint ? 'text-amber-500 stroke-[2.2]' : 'text-slate-400 dark:text-slate-500 stroke-[2]'}`} />
              {item.inMaint && (
                <span className="absolute -top-2 -right-3.5 bg-amber-500 text-slate-950 font-black text-[8px] px-1 rounded-full border border-white dark:border-[#090D16] shadow-xs flex items-center gap-0.5 animate-pulse whitespace-nowrap">
                  <AlertTriangle className="w-2 h-2 stroke-[2.5]" />
                  <span>維修中</span>
                </span>
              )}
            </div>
            <span className={`text-[9px] mt-0.5 tracking-tight ${item.inMaint ? 'font-black text-amber-600 dark:text-amber-400' : 'font-medium text-slate-400 dark:text-slate-500'}`}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminMaintenancePreview({
  config,
  previewDevice,
  setPreviewDevice,
}: AdminMaintenancePreviewProps) {
  const [showFullScreen, setShowFullScreen] = useState<boolean>(false);
  const isSinglePage = Boolean(config.scope && config.scope !== 'all');

  // 監聽 ESC 鍵自動關閉全螢幕預覽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullScreen) {
        setShowFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullScreen]);

  return (
    <div className="space-y-3.5">
      {/* 頂部操作與模式切換 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-sky-500" />
          <span>維護畫面即時完整預覽</span>
        </h4>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 手機 / 桌機 視圖切換 */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                previewDevice === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>手機版</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                previewDevice === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>桌機版</span>
            </button>
          </div>

          {/* 🔍 全螢幕 1:1 完整真實預覽按鈕 */}
          <button
            type="button"
            onClick={() => setShowFullScreen(true)}
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
            title="開啟 1:1 全螢幕真實視圖"
          >
            <Maximize2 className="w-3 h-3" />
            <span>全螢幕預覽</span>
          </button>
        </div>
      </div>

      {/* 嵌入式預覽視窗容器 */}
      <div
        className={`relative mx-auto rounded-3xl overflow-hidden border-4 border-slate-700 dark:border-slate-600 shadow-2xl bg-white dark:bg-[#0B0F17] transition-all duration-300 ${
          previewDevice === 'mobile' ? 'max-w-[360px] h-[560px]' : 'w-full h-[560px]'
        }`}
      >
        <div className="w-full h-full overflow-y-auto pointer-events-none">
          <MaintenanceScreen
            data={config}
            isPreview={true}
            isSinglePage={isSinglePage}
          />
        </div>

        {/* 若為單頁維護，在預覽底部呈現導覽列模擬 */}
        {isSinglePage && <SimulatedBottomNav scope={config.scope} />}
      </div>

      {/* 🌟 1:1 沉浸式全螢幕真實預覽 Modal 彈窗 */}
      {showFullScreen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          {/* 頂部懸浮控制膠囊 */}
          <div className="absolute top-4 z-[100000] bg-slate-900/95 text-white px-4 py-2 rounded-full border border-slate-700 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>全螢幕真實視圖預覽中</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition ${
                  previewDevice === 'mobile'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                手機
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition ${
                  previewDevice === 'desktop'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                桌機全寬
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => setShowFullScreen(false)}
              className="bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-black px-2.5 py-1 rounded-full transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>關閉 (ESC)</span>
            </button>
          </div>

          {/* 全螢幕預覽主內容 */}
          <div
            className={`w-full h-full overflow-y-auto relative transition-all duration-300 ${
              previewDevice === 'mobile'
                ? 'max-w-md mx-auto my-auto h-[100dvh] shadow-2xl border-x border-slate-800'
                : 'w-full h-[100dvh]'
            }`}
          >
            <MaintenanceScreen
              data={config}
              isPreview={false}
              isSinglePage={isSinglePage}
            />
            {isSinglePage && <SimulatedBottomNav scope={config.scope} />}
          </div>
        </div>
      )}
    </div>
  );
}

