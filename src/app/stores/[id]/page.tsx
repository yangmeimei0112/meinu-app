'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CustomModal from '@/components/CustomModal';
import CartBar from '@/components/CartBar';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem } from '@/types/database';
import { CartItem, MultiStoreCart } from '@/types/cart';

interface GroupOrderMeta {
  id: string;
  announcement: string | null;
  enable_min_threshold: boolean;
  min_threshold_amount: number;
  enable_countdown: boolean;
  cutoff_time: string | null;
}

export default function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const storeId = resolvedParams.id;

  const [store, setStore] = useState<Store | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [groupMeta, setGroupMeta] = useState<GroupOrderMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 全團已點總金額與品項跟風數量統計
  const [groupTotalAmount, setGroupTotalAmount] = useState<number>(0);
  const [popularCounts, setPopularCounts] = useState<Record<string, number>>({});

  // 截單倒數秒數
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [multiCart, setMultiCart] = useState<MultiStoreCart>({});

  // 讀取 LocalStorage
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

  // 抓取店家、菜單、團購活動 Meta 與熱門跟風數量
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
        .eq('status', 'open')
        .limit(1);

      if (storeData) setStore(storeData as Store);
      if (menuData) setMenuItems(menuData as MenuItem[]);

      if (groupData && groupData.length > 0) {
        const meta = groupData[0] as GroupOrderMeta;
        setGroupMeta(meta);

        // 計算倒數時間
        if (meta.cutoff_time) {
          const remaining = Math.max(
            0,
            Math.floor((new Date(meta.cutoff_time).getTime() - Date.now()) / 1000)
          );
          setCountdownSeconds(remaining);
        }

        // 抓取全團累積訂單金額與熱門跟風數量
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

  // 倒數計時器
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSeconds]);

  const currentStoreItems = multiCart[storeId]?.items || [];

  const handleAddToCart = (newItem: CartItem) => {
    if (!store) return;
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
  };

  const handleClearStoreCart = () => {
    const updated = { ...multiCart };
    delete updated[storeId];
    setMultiCart(updated);
    localStorage.setItem('menu_app_multi_cart', JSON.stringify(updated));
  };

  // 格式化倒數時間 MM:SS
  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <OfflineBanner />
      <Header />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-500 transition py-1"
        >
          ‹ 返回「咩nu」大廳
        </Link>

        {/* 1. 📢 團購公告欄 */}
        {groupMeta?.announcement && (
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl p-3 shadow-xs text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
            <span className="text-base shrink-0">📢</span>
            <p className="line-clamp-2">{groupMeta.announcement}</p>
          </div>
        )}

        {/* 2. ⏱️ 截單倒數與 🚚 湊單進度條 (動態開關控制) */}
        {groupMeta && (
          <div className="grid grid-cols-1 gap-2">
            {/* 倒數計時器 */}
            {groupMeta.enable_countdown && (
              <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center justify-between border border-slate-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">⏱️</span>
                  <span className="text-xs font-bold">預計截單倒數</span>
                </div>
                <span className="font-mono text-sm font-extrabold text-sky-400 bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                  {countdownSeconds > 0 ? formatCountdown(countdownSeconds) : '已截止收單'}
                </span>
              </div>
            )}

            {/* 湊單門檻進度條 */}
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
            {/* 店家抬頭卡片 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center gap-3.5">
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
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">
                  {store.name}
                </h2>
                <span className="inline-block mt-1 bg-sky-50 text-sky-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-100">
                  🟢 開放揪團點餐中
                </span>
              </div>
            </div>

            {/* 菜單品項 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center justify-between">
                <span>精選餐點</span>
                <span className="text-xs text-slate-400 font-normal">
                  共 {menuItems.length} 項
                </span>
              </h3>

              {menuItems.map((item: MenuItem) => {
                const popularQty = popularCounts[item.name] || 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMenuItem(item)}
                    className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs hover:border-sky-200 transition cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-base">
                          {item.name}
                        </h4>
                        {/* 🔥 全團熱門跟風標示 */}
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
                      className="bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 border border-sky-100"
                    >
                      + 加入
                    </button>
                  </div>
                );
              })}
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