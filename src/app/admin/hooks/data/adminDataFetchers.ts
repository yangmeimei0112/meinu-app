import { supabase } from '@/lib/supabase';
import { Store, Category, MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
import { GroupOrderAdmin, OrderSubmissionAdmin } from '../../admin-types';
import { parseOrderProgressStatus, isOrderHiddenFromAdmin } from '@/types/orderStatus';

export interface AdminRawDataResult {
  stores: Store[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  allMenuItems: MenuItem[];
  archivedGroups: GroupOrderAdmin[];
  formattedSubs: OrderSubmissionAdmin[];
  activeGroups: GroupOrderAdmin[];
}

/**
 * 📦 檢索全域店家、菜單、全域設定與即時訂單
 */
export async function fetchAdminAllData(): Promise<AdminRawDataResult> {
  const [gRes, sRes, cRes, pRes, soRes, mRes, sortRes, storeCodeRes] = await Promise.all([
    supabase.from('group_orders').select(`*, stores (*)`).order('created_at', { ascending: false }),
    supabase.from('stores').select('*').order('name', { ascending: true }),
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('payment_methods').select('*').order('name', { ascending: true }),
    supabase.from('sold_out_options').select('*').order('sort_order', { ascending: true }),
    supabase.from('menu_items').select('*').order('name', { ascending: true }),
    fetch('/api/menu/sort-order', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    fetch('/api/stores/code', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
  ]);

  const rawStores = (sRes.data as Store[]) || [];
  const codeMap: Record<string, string> = storeCodeRes?.codeMap || {};

  // 智慧指派與綁定 S-??? 商家編號
  const existingUsedNumbers = new Set<number>();
  Object.values(codeMap).forEach((c) => {
    const num = parseInt(String(c).replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) existingUsedNumbers.add(num);
  });

  let nextAutoNum = 1;
  const formattedStores: Store[] = rawStores.map((store) => {
    let code = codeMap[store.id];
    if (!code) {
      while (existingUsedNumbers.has(nextAutoNum)) {
        nextAutoNum++;
      }
      code = `S-${String(nextAutoNum).padStart(3, '0')}`;
      existingUsedNumbers.add(nextAutoNum);
    }
    return { ...store, code };
  });

  const categories = (cRes.data as Category[]) || [];
  const paymentMethods = (pRes.data as PaymentMethod[]) || [];
  const soldOutOptions = (soRes.data as SoldOutOption[]) || [];

  const rawMenuItems = (mRes.data as MenuItem[]) || [];
  const orderMap: Record<string, string[]> = sortRes?.orderMap || {};

  const sortedMenuItems = [...rawMenuItems].sort((a, b) => {
    if (a.store_id !== b.store_id) return 0;
    const storeOrder = orderMap[a.store_id] || [];
    const indexA = storeOrder.indexOf(a.id);
    const indexB = storeOrder.indexOf(b.id);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name, 'zh-TW');
  });

  const allG = gRes.data || [];
  const completedList = allG.filter((g) => g.status === 'completed');
  const archivedGroups = completedList as GroupOrderAdmin[];

  // 抓取全站所有未歸檔即時訂單（適配 Supabase 實際 Schema）
  const { data: allSubList, error: subErr } = await supabase
    .from('order_submissions')
    .select(`
      id, order_number, user_nickname, payment_method_name, sold_out_option,
      total_amount, final_amount, is_paid, signature_data, signature_url, created_at, group_order_id,
      group_orders (id, title, store_id, stores (id, name)),
      order_items (id, item_name, quantity, unit_price, custom_notes)
    `)
    .order('created_at', { ascending: false });

  if (subErr) console.error('抓取訂單失敗:', subErr);

  const rawSubRows = (allSubList as unknown as any[]) || [];
  const completedGroupIds = new Set(completedList.map((g) => g.id));
  const activeSubList = rawSubRows.filter((s) => {
    if (isOrderHiddenFromAdmin(s.signature_url)) return false;
    if (s.group_order_id && completedGroupIds.has(s.group_order_id)) return false;
    return true;
  });

  const storeMap = new Map(formattedStores.map((s) => [s.id, s]));
  const formattedSubs: OrderSubmissionAdmin[] = activeSubList.map((s: any) => {
    const resolvedStoreId =
      s.group_orders?.store_id ||
      s.group_orders?.stores?.id ||
      '';
    const matchedStore = storeMap.get(resolvedStoreId);
    const resolvedStoreName =
      matchedStore?.name ||
      s.group_orders?.stores?.name ||
      s.group_orders?.title ||
      '店家餐點';

    return {
      ...s,
      store_id: resolvedStoreId,
      store_name: resolvedStoreName,
      order_items: s.order_items || [],
      progress_status: parseOrderProgressStatus(s.signature_url),
    };
  });

  // 以店家為單位產生分流視圖，包含即時訂單數與營業額統計
  const storeGroupsWithStats: GroupOrderAdmin[] = formattedStores.map((store) => {
    const sSubs = formattedSubs.filter((s) => s.store_id === store.id || s.group_order_id === store.id);
    return {
      id: store.id,
      store_id: store.id,
      title: store.name,
      status: store.is_accepting_orders === false ? 'closed' : 'open',
      announcement: store.announcement || null,
      delivery_fee: 0,
      discount_amount: 0,
      rounding_rule: 'floor',
      enable_min_threshold: store.enable_min_threshold,
      min_threshold_amount: store.min_threshold_amount,
      enable_countdown: store.enable_countdown,
      cutoff_time: store.cutoff_time,
      enable_budget_limit: store.enable_budget_limit,
      budget_limit_amount: store.budget_limit_amount,
      stores: store,
      order_count: sSubs.length,
      total_sales: sSubs.reduce((sum, s) => sum + s.final_amount, 0),
    };
  });

  storeGroupsWithStats.sort((a, b) => {
    if ((a.order_count || 0) > 0 && (b.order_count || 0) === 0) return -1;
    if ((a.order_count || 0) === 0 && (b.order_count || 0) > 0) return 1;
    if (a.status === 'open' && b.status === 'closed') return -1;
    if (a.status === 'closed' && b.status === 'open') return 1;
    return a.title.localeCompare(b.title, 'zh-TW');
  });

  return {
    stores: formattedStores,
    categories,
    paymentMethods,
    soldOutOptions,
    allMenuItems: sortedMenuItems,
    archivedGroups,
    formattedSubs,
    activeGroups: storeGroupsWithStats,
  };
}
