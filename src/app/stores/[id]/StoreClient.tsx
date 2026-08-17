'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CustomModal from '@/components/CustomModal';
import CartBar from '@/components/CartBar';
import OfflineBanner from '@/components/OfflineBanner';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';
import LiveOrderCounter from '@/components/LiveOrderCounter';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem } from '@/types/database';
import { CartItem } from '@/types/cart';
import { useMultiCart } from '@/lib/useMultiCart';
import { useDebounce } from '@/lib/useDebounce';
import StoreProductCard from './components/StoreProductCard';

interface GroupOrderMeta {
  id: string;
  announcement: string | null;
  status: 'open' | 'closed' | 'completed';
  enable_min_threshold: boolean;
  min_threshold_amount: number;
  enable_countdown: boolean;
  cutoff_time: string | null;
  enable_budget_limit?: boolean;
  budget_limit_amount?: number;
}

export default function StoreClient({ storeId }: { storeId: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [groupMeta, setGroupMeta] = useState<GroupOrderMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [groupTotalAmount, setGroupTotalAmount] = useState<number>(0);
  const [popularCounts, setPopularCounts] = useState<Record<string, number>>({});
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');

  // 搜尋防抖 Hook
  const debouncedMenuSearch = useDebounce(menuSearchQuery, 200);

  // 多店家購物車 Hook
  const { cart, addItem, clearStoreCart } = useMultiCart();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 並行發送查詢，消除網路請求瀑布流
      const [storeRes, menuRes, groupRes] = await Promise.all([
        supabase
          .from('stores')
          .select('id, name, image_url, category_id, is_active')
          .eq('id', storeId)
          .single(),
        supabase
          .from('menu_items')
          .select('id, store_id, name, price, description, is_sold_out, custom_groups')
          .eq('store_id', storeId),
        supabase
          .from('group_orders')
          .select('*')
          .eq('store_id', storeId)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      if (storeRes.data) setStore(storeRes.data as Store);
      
      if (menuRes.data) {
        let items = menuRes.data as MenuItem[];
        // 🚀 在背景預先載入並合併所有品項的客製化規格選項，確保使用者點擊餐點時 0ms 瞬間開啟，無需等待
        const itemsNeedingFallback = items.filter((i) => !i.custom_groups || i.custom_groups.length === 0);
        if (itemsNeedingFallback.length > 0) {
          const itemIds = itemsNeedingFallback.map((i) => i.id);
          const { data: ogData } = await supabase
            .from('option_groups')
            .select(`
              id,
              menu_item_id,
              title,
              min_select,
              max_select,
              option_items (
                id,
                name,
                extra_price
              )
            `)
            .in('menu_item_id', itemIds)
            .order('sort_order', { ascending: true });

          if (ogData && ogData.length > 0) {
            const groupMap: Record<string, any[]> = {};
            ogData.forEach((g: any) => {
              if (!groupMap[g.menu_item_id]) groupMap[g.menu_item_id] = [];
              groupMap[g.menu_item_id].push({
                id: g.id,
                title: g.title,
                type: g.max_select === 1 ? 'single' : g.max_select > 1 ? 'limit' : 'any',
                limit_number: g.max_select,
                options: (g.option_items || []).map((opt: any) => ({
                  id: opt.id,
                  name: opt.name,
                  price_adjustment: opt.extra_price || 0,
                })),
              });
            });

            items = items.map((item) => {
              if ((!item.custom_groups || item.custom_groups.length === 0) && groupMap[item.id]) {
                return {
                  ...item,
                  custom_groups: groupMap[item.id],
                };
              }
              return item;
            });
          }
        }
        setMenuItems(items);
      }

      if (groupRes.data && groupRes.data.length > 0) {
        const meta = groupRes.data[0] as GroupOrderMeta;
        setGroupMeta(meta);

        if (meta.cutoff_time) {
          const remaining = Math.max(
            0,
            Math.floor((new Date(meta.cutoff_time).getTime() - Date.now()) / 1000)
          );
          setCountdownSeconds(remaining);
        }

        const { data: subData } = await supabase
          .from('order_submissions')
          .select('id, total_amount, order_items(item_name, quantity)')
          .eq('group_order_id', meta.id);

        if (subData) {
          const total = subData.reduce((sum, s) => sum + s.total_amount, 0);
          setGroupTotalAmount(total);

          const counts: Record<string, number> = {};
          subData.forEach((s) => {
            s.order_items?.forEach((item: { item_name: string; quantity: number }) => {
              counts[item.item_name] = (counts[item.item_name] || 0) + item.quantity;
            });
          });
          setPopularCounts(counts);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [storeId]);

  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);

  // 🔗 2. 指定店家專屬「揪團分享」按鈕動作
  const handleShareStore = async () => {
    if (!store) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `【咩nu】大家揪團點「${store.name}」！`,
      text: `點擊進入「${store.name}」的菜單選購餐點，填寫暱稱即可送單！`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // 使用者取消分享不處理
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`📋 「${store.name}」專屬揪團連結已複製！`);
    }
  };

  const currentStoreItems = useMemo(() => cart[storeId]?.items || [], [cart, storeId]);
  const currentStoreTotal = useMemo(
    () => currentStoreItems.reduce((sum, i) => sum + i.totalPrice, 0),
    [currentStoreItems]
  );
  const isClosed = groupMeta?.status === 'closed';
  const isGroupClosed = isClosed;

  // 記憶化餐點搜尋過濾結果
  const filteredMenuItems = useMemo(() => {
    const keyword = debouncedMenuSearch.trim().toLowerCase();
    if (!keyword) return menuItems;
    return menuItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(keyword);
      const descMatch = (item.description || '').toLowerCase().includes(keyword);
      return nameMatch || descMatch;
    });
  }, [menuItems, debouncedMenuSearch]);

  const handleAddToCart = useCallback(
    (newItem: CartItem) => {
      if (isGroupClosed) {
        alert('⚠️ 團長已截單，目前停止收單中！');
        return;
      }
      addItem(newItem);
      showToast(`🛒 已將「${newItem.name}」加入購物車！`);
    },
    [isGroupClosed, addItem, showToast]
  );

  const handleClearStoreCart = useCallback(() => {
    clearStoreCart(storeId);
  }, [clearStoreCart, storeId]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isUrgent = countdownSeconds > 0 && countdownSeconds <= 300;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 pb-28 transition-colors duration-200">
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition py-1"
          >
            ‹ 返回「咩nu」大廳
          </Link>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {store?.name ? `店家：${store.name}` : ''}
          </span>
        </div>

        <LiveOrderCounter storeId={storeId} />

        {isGroupClosed && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-xs">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-extrabold text-rose-800 dark:text-rose-300">團長已截單，停止收單中</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-normal mt-0.5">
                此團購活動已截止，無法新增餐點與送出訂單。
              </p>
            </div>
          </div>
        )}

        {groupMeta?.announcement && (
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-3 shadow-xs text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <span className="text-base shrink-0">📢</span>
            <p className="line-clamp-2">{groupMeta.announcement}</p>
          </div>
        )}

        {groupMeta?.enable_budget_limit && groupMeta?.budget_limit_amount && (
          <BudgetLimitNotice
            budgetLimit={groupMeta.budget_limit_amount}
            totalAmount={currentStoreTotal}
          />
        )}

        {groupMeta && (
          <div className="grid grid-cols-1 gap-2">
            {groupMeta.enable_countdown && (
              <div
                className={`rounded-2xl p-3 flex items-center justify-between border shadow-xs transition-colors ${
                  isUrgent
                    ? 'bg-rose-950 text-rose-200 border-rose-800 animate-pulse'
                    : 'bg-slate-900 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{isUrgent ? '🔥' : '⏱️'}</span>
                  <span className="text-xs font-bold">
                    {isUrgent ? '即將截單！把握時間' : '預計截單倒數'}
                  </span>
                </div>
                <span
                  className={`font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-lg border ${
                    isUrgent
                      ? 'bg-rose-900 text-rose-300 border-rose-700'
                      : 'text-sky-400 bg-slate-800 dark:bg-slate-950 border-slate-700 dark:border-slate-700'
                  }`}
                >
                  {countdownSeconds > 0 ? formatCountdown(countdownSeconds) : '已截止收單'}
                </span>
              </div>
            )}

            {groupMeta.enable_min_threshold && (
              <div className="bg-white dark:bg-[#131B2B] rounded-2xl p-3 border border-sky-100 dark:border-slate-800 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <span>🚚 起送湊單進度</span>
                    <span className="text-sky-600 dark:text-sky-400">(${groupTotalAmount} / ${groupMeta.min_threshold_amount})</span>
                  </span>
                  <span className="text-sky-600 dark:text-sky-400">
                    {groupTotalAmount >= groupMeta.min_threshold_amount
                      ? '🎉 已達標！'
                      : `還差 $${groupMeta.min_threshold_amount - groupTotalAmount} 元`}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-blue-500 h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (groupTotalAmount / groupMeta.min_threshold_amount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse border border-slate-100 dark:border-slate-800">
            正在載入菜單與全團點餐數據...
          </div>
        ) : !store ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            找不到該店家資訊
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-3xl shrink-0 border border-sky-100 dark:border-sky-900/60 overflow-hidden">
                  {store.image_url ? (
                    <img
                      src={store.image_url}
                      alt={store.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🥤'
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    {store.name}
                  </h2>
                  <span className="inline-block mt-1 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100 dark:border-sky-800/60">
                    🟢 開放揪團中
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShareStore}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-xs transition active:scale-95 shrink-0 flex items-center gap-1"
              >
                <span>🔗 揪團分享</span>
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span>精選餐點</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                  共 {filteredMenuItems.length} 項
                </span>
              </h3>

              <div className="relative">
                <label htmlFor="menu-search-query-input" className="sr-only">搜尋餐點名稱或關鍵字</label>
                <input
                  id="menu-search-query-input"
                  name="menuSearch"
                  type="text"
                  aria-label="搜尋餐點名稱或關鍵字"
                  placeholder="搜尋餐點名稱或關鍵字..."
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">🔍</span>
              </div>

              {filteredMenuItems.map((item: MenuItem) => (
                <StoreProductCard
                  key={item.id}
                  item={item}
                  popularQty={popularCounts[item.name] || 0}
                  onSelect={(selected) => setSelectedMenuItem(selected)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* 彈出客製化規格選擇跳窗 */}
      <CustomModal
        item={selectedMenuItem}
        storeId={store?.id || ''}
        storeName={store?.name || ''}
        onClose={() => setSelectedMenuItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 底部懸浮購物車條 */}
      <CartBar
        cartItems={currentStoreItems}
        onClearCart={handleClearStoreCart}
      />
    </div>
  );
}