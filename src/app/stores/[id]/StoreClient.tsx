'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CustomModal from '@/components/CustomModal';
import CartBar from '@/components/CartBar';
import OfflineBanner from '@/components/OfflineBanner';
import BudgetLimitNotice from '@/components/BudgetLimitNotice';
import LiveOrderCounter from '@/components/LiveOrderCounter';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem } from '@/types/database';
import { CartItem, MultiStoreCart } from '@/types/cart';

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
  const [multiCart, setMultiCart] = useState<MultiStoreCart>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const saved = localStorage.getItem('menu_app_multi_cart');
    if (saved) {
      try {
        setMultiCart(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', storeId);

      const { data: groupData } = await supabase
        .from('group_orders')
        .select('*')
        .eq('store_id', storeId)
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (storeData) setStore(storeData as Store);
      if (menuData) setMenuItems(menuData as MenuItem[]);

      if (groupData && groupData.length > 0) {
        const meta = groupData[0] as GroupOrderMeta;
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

  const currentStoreItems = multiCart[storeId]?.items || [];
  const currentStoreTotal = currentStoreItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const isClosed = groupMeta?.status === 'closed';

  const filteredMenuItems = menuItems.filter((item) => {
    const keyword = menuSearchQuery.trim().toLowerCase();
    if (!keyword) return true;
    const nameMatch = item.name.toLowerCase().includes(keyword);
    const descMatch = (item.description || '').toLowerCase().includes(keyword);
    return nameMatch || descMatch;
  });

  const handleAddToCart = (newItem: CartItem) => {
    if (!store) return;
    if (isClosed) {
      alert('⚠️ 團長已截單，目前停止收單中！');
      return;
    }
    const updated: MultiStoreCart = {
      ...multiCart,
      [storeId]: {
        storeId: store.id,
        storeName: store.name,
        items: [...currentStoreItems, newItem],
      },
    };
    setMultiCart(updated);
    localStorage.setItem('menu_app_multi_cart', JSON.stringify(updated));
    showToast(`🛒 已將「${newItem.name}」加入購物車！`);
  };

  const handleClearStoreCart = () => {
    const updated = { ...multiCart };
    delete updated[storeId];
    setMultiCart(updated);
    localStorage.setItem('menu_app_multi_cart', JSON.stringify(updated));
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isUrgent = countdownSeconds > 0 && countdownSeconds <= 300;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <OfflineBanner />
      <Header />

      {/* 複製提示 Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-500 transition py-1"
          >
            ‹ 返回「咩nu」大廳
          </Link>
        </div>

        {/* 實時全團點餐進度 */}
        <LiveOrderCounter storeId={storeId} />

        {/* 團購截單鎖定提醒條 */}
        {isClosed && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-3.5 shadow-xs text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <span className="text-lg shrink-0">🔒</span>
            <div>
              <p className="font-extrabold text-rose-800">團長已截單，停止收單中</p>
              <p className="text-[11px] text-rose-600 font-normal mt-0.5">
                此團購活動已截止，無法新增餐點與送出訂單。
              </p>
            </div>
          </div>
        )}

        {/* 團長公告欄 */}
        {groupMeta?.announcement && (
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-3 shadow-xs text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <span className="text-base shrink-0">📢</span>
            <p className="line-clamp-2">{groupMeta.announcement}</p>
          </div>
        )}

        {/* 個人消費預算上限提醒 */}
        {groupMeta?.enable_budget_limit && groupMeta?.budget_limit_amount && (
          <BudgetLimitNotice
            budgetLimit={groupMeta.budget_limit_amount}
            totalAmount={currentStoreTotal}
          />
        )}

        {groupMeta && (
          <div className="grid grid-cols-1 gap-2">
            {/* 預計截單倒數計時器 */}
            {groupMeta.enable_countdown && (
              <div
                className={`rounded-2xl p-3 flex items-center justify-between border shadow-xs transition-colors ${
                  isUrgent
                    ? 'bg-rose-950 text-rose-200 border-rose-800 animate-pulse'
                    : 'bg-slate-900 text-white border-slate-800'
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
                      : 'text-sky-400 bg-slate-800 border-slate-700'
                  }`}
                >
                  {countdownSeconds > 0 ? formatCountdown(countdownSeconds) : '已截止收單'}
                </span>
              </div>
            )}

            {/* 起送 / 免運門檻湊單進度條 */}
            {groupMeta.enable_min_threshold && (
              <div className="bg-white rounded-2xl p-3 border border-sky-100 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 flex items-center gap-1">
                    <span>🚚 起送湊單進度</span>
                    <span className="text-sky-600">(${groupTotalAmount} / ${groupMeta.min_threshold_amount})</span>
                  </span>
                  <span className="text-sky-600">
                    {groupTotalAmount >= groupMeta.min_threshold_amount
                      ? '🎉 已達標！'
                      : `還差 $${groupMeta.min_threshold_amount - groupTotalAmount} 元`}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
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
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-sm animate-pulse">
            正在載入菜單與全團點餐數據...
          </div>
        ) : !store ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-500">
            找不到該店家資訊
          </div>
        ) : (
          <>
            {/* 店家抬頭卡片：右側加入「🔗 揪團分享」按鈕 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-3xl shrink-0 border border-sky-100 overflow-hidden">
                  {store.image_url ? (
                    <img
                      src={store.image_url}
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🥤'
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-slate-800 truncate">
                    {store.name}
                  </h2>
                  <span className="inline-block mt-1 bg-sky-50 text-sky-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100">
                    🟢 開放揪團中
                  </span>
                </div>
              </div>

              {/* 🔗 店家專屬揪團分享按鈕 */}
              <button
                type="button"
                onClick={handleShareStore}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-xs transition active:scale-95 shrink-0 flex items-center gap-1"
              >
                <span>🔗 揪團分享</span>
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>精選餐點</span>
                <span className="text-xs text-slate-400 font-normal">
                  共 {filteredMenuItems.length} 項
                </span>
              </h3>

              <div className="relative">
                <input
                  type="text"
                  placeholder="搜尋餐點名稱或關鍵字..."
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-800 border border-slate-200 rounded-2xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition shadow-xs"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              </div>

              {filteredMenuItems.map((item: MenuItem) => {
                const popularQty = popularCounts[item.name] || 0;
                const isSoldOut = item.is_sold_out;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isSoldOut) setSelectedMenuItem(item);
                    }}
                    className={`bg-white rounded-3xl p-4 border shadow-xs transition flex items-center justify-between gap-3 ${
                      isSoldOut
                        ? 'border-slate-200 opacity-60 cursor-not-allowed'
                        : 'border-slate-100 hover:border-sky-200 cursor-pointer active:scale-[0.99]'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-base">
                          {item.name}
                        </h4>
                        {isSoldOut && (
                          <span className="bg-slate-200 text-slate-600 border border-slate-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            已售完
                          </span>
                        )}
                        {popularQty > 0 && (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            🔥 本團已點 {popularQty} 份
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-sm font-extrabold text-sky-600">
                        ${item.price} 元
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSoldOut}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 border ${
                        isSoldOut
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white border-sky-100'
                      }`}
                    >
                      {isSoldOut ? '已售完' : '+ 加入'}
                    </button>
                  </div>
                );
              })}

              {filteredMenuItems.length === 0 && (
                <div className="bg-white rounded-3xl p-6 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  找不到符合關鍵字的餐點，請試試其他搜尋字詞。
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {selectedMenuItem && store && (
        <CustomModal
          item={selectedMenuItem}
          storeId={store.id}
          storeName={store.name}
          onClose={() => setSelectedMenuItem(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartBar cartItems={currentStoreItems} onClearCart={handleClearStoreCart} />
    </div>
  );
}