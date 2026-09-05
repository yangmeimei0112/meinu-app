'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMultiCart } from '@/lib/useMultiCart';
import { Home, Search, ShoppingCart, ClipboardList, AlertTriangle, User } from 'lucide-react';
import { useMaintenanceStatus } from './maintenance/useMaintenanceStatus';

export const ORDERS_UPDATE_EVENT = 'menu_app_orders_updated';

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined' || !window || typeof window.addEventListener !== 'function') return () => {};
  try {
    window.addEventListener('storage', callback);
    window.addEventListener(ORDERS_UPDATE_EVENT, callback);
  } catch {}
  return () => {
    try {
      if (typeof window !== 'undefined' && window && typeof window.removeEventListener === 'function') {
        window.removeEventListener('storage', callback);
        window.removeEventListener(ORDERS_UPDATE_EVENT, callback);
      }
    } catch {}
  };
}

function getHasNewOrdersSnapshot() {
  if (typeof window === 'undefined') return false;
  try {
    let hasActualOrders = false;
    const historyRaw = localStorage.getItem('menu_app_order_history');
    if (historyRaw) {
      const list = JSON.parse(historyRaw);
      if (Array.isArray(list) && list.length > 0) {
        hasActualOrders = true;
      }
    }
    const lastId = localStorage.getItem('menu_app_last_order_id');
    if (lastId && typeof lastId === 'string' && lastId.trim().length > 0) {
      hasActualOrders = true;
    }

    if (!hasActualOrders) return false;
    return localStorage.getItem('menu_app_has_new_order') === 'true';
  } catch {
    return false;
  }
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalCartItemCount } = useMultiCart();
  const hasNewOrder = useSyncExternalStore(subscribeStorage, getHasNewOrdersSnapshot, () => false);
  const { maintenanceData } = useMaintenanceStatus(pathname);

  // 在後台頁面（/admin）不展示前台底部導覽列
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isMaintActive = Boolean(maintenanceData?.is_maintenance);
  const activeScopes =
    maintenanceData?.scopes && maintenanceData.scopes.length > 0
      ? maintenanceData.scopes
      : [maintenanceData?.scope || 'all'];

  // 判斷各分頁是否正處於維修狀態
  const isItemUnderMaintenance = (itemId: string) => {
    if (!isMaintActive) return false;
    if (activeScopes.includes('all')) return true;
    if (itemId === 'home' && activeScopes.includes('home')) return true;
    if (itemId === 'search' && activeScopes.includes('search')) return true;
    if (itemId === 'cart' && (activeScopes.includes('cart') || activeScopes.includes('checkout'))) return true;
    if (itemId === 'orders' && activeScopes.includes('my-orders')) return true;
    if (itemId === 'account' && activeScopes.includes('account')) return true;
    return false;
  };

  const navItems = [
    {
      id: 'home',
      label: '美食大廳',
      href: '/',
      icon: (active: boolean, inMaint: boolean) => (
        <Home
          className={`w-5 h-5 transition-transform duration-150 ${
            inMaint
              ? 'text-amber-500 stroke-[2.2]'
              : active
              ? 'stroke-[2.5] scale-105'
              : 'stroke-[2]'
          }`}
        />
      ),
    },
    {
      id: 'search',
      label: '搜尋探索',
      href: '/search',
      icon: (active: boolean, inMaint: boolean) => (
        <Search
          className={`w-5 h-5 transition-transform duration-150 ${
            inMaint
              ? 'text-amber-500 stroke-[2.2]'
              : active
              ? 'stroke-[2.5] scale-105'
              : 'stroke-[2]'
          }`}
        />
      ),
    },
    {
      id: 'cart',
      label: '購物車',
      href: '/cart',
      badge: totalCartItemCount > 0 ? (totalCartItemCount > 99 ? '99+' : totalCartItemCount) : null,
      icon: (active: boolean, inMaint: boolean) => (
        <ShoppingCart
          className={`w-5 h-5 transition-transform duration-150 ${
            inMaint
              ? 'text-amber-500 stroke-[2.2]'
              : active
              ? 'stroke-[2.5] scale-105'
              : 'stroke-[2]'
          }`}
        />
      ),
    },
    {
      id: 'orders',
      label: '我的訂單',
      href: '/my-orders',
      hasDot: hasNewOrder,
      icon: (active: boolean, inMaint: boolean) => (
        <ClipboardList
          className={`w-5 h-5 transition-transform duration-150 ${
            inMaint
              ? 'text-amber-500 stroke-[2.2]'
              : active
              ? 'stroke-[2.5] scale-105'
              : 'stroke-[2]'
          }`}
        />
      ),
    },
    {
      id: 'account',
      label: '我的帳戶',
      href: '/account',
      icon: (active: boolean, inMaint: boolean) => (
        <User
          className={`w-5 h-5 transition-transform duration-150 ${
            inMaint
              ? 'text-amber-500 stroke-[2.2]'
              : active
              ? 'stroke-[2.5] scale-105'
              : 'stroke-[2]'
          }`}
        />
      ),
    },
  ];

  return (
    <nav
      data-theme-module="bottom-nav"
      aria-label="APP 底部主要導覽列"
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] transition-colors duration-200 safe-area-pb"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href.startsWith('/#')
              ? false
              : pathname.startsWith(item.href);

          const isUnderMaint = isItemUnderMaintenance(item.id);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-150 active:scale-90 select-none ${
                isUnderMaint
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : isActive
                  ? 'text-sky-500 dark:text-sky-400 font-extrabold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold'
              }`}
            >
              {/* 圖示與角標 */}
              <div className="relative flex items-center justify-center">
                {item.icon(isActive, isUnderMaint)}

                {/* ⚠️ 單頁維修中醒目黃色小徽章 */}
                {isUnderMaint && (
                  <span className="absolute -top-2 -right-4 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-white dark:border-[#090D16] shadow-xs flex items-center gap-0.5 animate-pulse z-10 whitespace-nowrap">
                    <AlertTriangle className="w-2.5 h-2.5 stroke-[2.5]" />
                    <span>維修中</span>
                  </span>
                )}

                {/* 數字 Badge (購物車件數 - 僅在非維修時顯示) */}
                {!isUnderMaint && item.badge !== undefined && item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#090D16] shadow-xs animate-in zoom-in-50 duration-150">
                    {item.badge}
                  </span>
                )}

                {/* 小紅點 (新訂單提示 - 僅在非維修時顯示) */}
                {!isUnderMaint && item.hasDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#090D16] shadow-xs">
                    <span className="w-full h-full rounded-full bg-rose-400 animate-ping block opacity-75" />
                  </span>
                )}
              </div>

              {/* 導覽文字 */}
              <span
                className={`text-[10px] tracking-tight mt-1 ${
                  isUnderMaint
                    ? 'font-black text-amber-600 dark:text-amber-400'
                    : isActive
                    ? 'font-black'
                    : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {/* 啟用中底部發光指示點 */}
              {isActive && !isUnderMaint && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

