export type MaintenanceScope =
  | 'all'
  | 'home'
  | 'search'
  | 'stores'
  | 'cart'
  | 'checkout'
  | 'my-orders'
  | 'account'
  | 'legal';

export const VALID_SCOPES: MaintenanceScope[] = [
  'all',
  'home',
  'search',
  'stores',
  'cart',
  'checkout',
  'my-orders',
  'account',
  'legal',
];

export interface MaintenanceConfig {
  is_maintenance: boolean;
  scope?: MaintenanceScope; // 向下相容單選
  scopes?: MaintenanceScope[]; // 🌟 支援多選 / 複選單一頁面維護 (例如: ['cart', 'checkout'])
  title: string;
  message: string;
  estimated_end_time?: string;
  reason?: string;
  custom_image_url?: string;
  updated_at: string;
  activated_at?: string; // 伺服端維護啟動之絕對時間戳（ISO 8601），供在線 30 秒過渡精確同步
  epoch?: number; // 遞增狀態世代序號，徹底杜絕快取競態與重整迴圈
}

export const defaultMaintenanceConfig: MaintenanceConfig = {
  is_maintenance: false,
  scope: 'all',
  scopes: ['all'],
  title: '網站更新維護中，請稍後再下單',
  message: '為了提供更好的揪團點餐體驗，網站目前正在進行例行升級維護。暫停點餐服務，請稍後再下單，感謝您的耐心等候。',
  estimated_end_time: '預計 15-30 分鐘內完成',
  reason: '系統例行升級',
  custom_image_url: '',
  updated_at: new Date().toISOString(),
  activated_at: '',
  epoch: 1,
};

/**
 * 🌐 精準路由比對器 (Exact Route Normalizer & Matcher)
 * 統一前後端路由比對邏輯，後台管理 (/admin) 永遠 100% 絕對豁免
 */
export function isRouteInMaintenance(
  rawPathname?: string | null,
  scopesOrScope?: MaintenanceScope[] | MaintenanceScope,
  fallbackScope?: MaintenanceScope | MaintenanceScope[]
): boolean {
  if (rawPathname === null || rawPathname === undefined) return false;
  const pathname = rawPathname.split('?')[0].split('#')[0];

  // 🛡️ 後台管理路徑永遠絕對豁免
  if (pathname.startsWith('/admin') || pathname === '/admin') return false;

  let activeScopes: MaintenanceScope[] = [];
  if (Array.isArray(scopesOrScope) && scopesOrScope.length > 0) {
    activeScopes = scopesOrScope;
  } else if (typeof scopesOrScope === 'string') {
    activeScopes = [scopesOrScope];
  } else if (Array.isArray(fallbackScope) && fallbackScope.length > 0) {
    activeScopes = fallbackScope;
  } else if (typeof fallbackScope === 'string') {
    activeScopes = [fallbackScope];
  } else {
    activeScopes = ['all'];
  }

  if (activeScopes.includes('all')) return true;

  return activeScopes.some((s) => {
    switch (s) {
      case 'home':
        return pathname === '/' || pathname === '';
      case 'search':
        return pathname === '/search' || pathname.startsWith('/search/');
      case 'stores':
        return pathname.startsWith('/stores/') || pathname === '/stores';
      case 'cart':
        return pathname === '/cart' || pathname.startsWith('/cart/');
      case 'checkout':
        return pathname === '/checkout' || pathname.startsWith('/checkout/');
      case 'my-orders':
        return (
          pathname === '/my-orders' ||
          pathname.startsWith('/my-orders/') ||
          pathname.startsWith('/order-status/')
        );
      case 'account':
        return pathname === '/account' || pathname.startsWith('/account/');
      case 'legal':
        return (
          pathname.startsWith('/legal') ||
          pathname === '/terms' ||
          pathname === '/privacy' ||
          pathname === '/user-terms' ||
          pathname === '/security'
        );
      default:
        return false;
    }
  });
}
