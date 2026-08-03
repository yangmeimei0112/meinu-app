'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import SignatureModal from '@/components/SignatureModal';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem, PaymentMethod, Category } from '@/types/database';

interface OrderItemAdmin {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

interface OrderSubmissionAdmin {
  id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  signature_data: string | null;
  created_at: string;
  order_items: OrderItemAdmin[];
}

interface GroupOrderAdmin {
  id: string;
  store_id: string;
  title: string;
  status: 'open' | 'closed' | 'completed';
  announcement: string | null;
  delivery_fee: number;
  discount_amount: number;
  rounding_rule: string; // 'floor' | 'ceil' | 'round'
}

export default function AdminPage() {
  const [passcode, setPasscode] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // 頁籤分頁 State: 'active' | 'crud' | 'archive'
  const [activeTab, setActiveTab] = useState<'active' | 'crud' | 'archive'>('active');

  const [activeGroup, setActiveGroup] = useState<GroupOrderAdmin | null>(null);
  const [archivedGroups, setArchivedGroups] = useState<GroupOrderAdmin[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<OrderSubmissionAdmin[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 簽名 Modal Target
  const [signatureTarget, setSignatureTarget] = useState<OrderSubmissionAdmin | null>(null);

  // 找零 Modal Target
  const [changeModalTarget, setChangeModalTarget] = useState<{ nickname: string; amount: number } | null>(null);
  const [receivedCash, setReceivedCash] = useState<string>('');

  // 多選對帳
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);

  // 團長手動補單
  const [showManualOrderModal, setShowManualOrderModal] = useState<boolean>(false);
  const [manualNickname, setManualNickname] = useState<string>('');
  const [manualSelectedItem, setManualSelectedItem] = useState<MenuItem | null>(null);
  const [manualQty, setManualQty] = useState<number>(1);
  const [manualNotes, setManualNotes] = useState<string>('');

  // 平攤設定與取整規則
  const [inputDeliveryFee, setInputDeliveryFee] = useState<number>(0);
  const [inputDiscount, setInputDiscount] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<'floor' | 'ceil' | 'round'>('floor');

  // 新增類別/店家/菜單
  const [newCatName, setNewCatName] = useState<string>('');
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newStoreCatId, setNewStoreCatId] = useState<string>('');
  const [newMenuName, setNewMenuName] = useState<string>('');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(50);

  const csvFileRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '8888') {
      setIsUnlocked(true);
    } else {
      alert('❌ 密碼錯誤！預設密碼為：8888');
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);

    const { data: catList } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (catList) setCategories(catList as Category[]);

    const { data: storeList } = await supabase.from('stores').select('*');
    if (storeList) setStores(storeList as Store[]);

    const { data: pmData } = await supabase.from('payment_methods').select('*');
    if (pmData) setPaymentMethods(pmData as PaymentMethod[]);

    const { data: groupList } = await supabase
      .from('group_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupList) {
      const openGroup = groupList.find((g) => g.status !== 'completed');
      const completedList = groupList.filter((g) => g.status === 'completed');

      setArchivedGroups(completedList as GroupOrderAdmin[]);

      if (openGroup) {
        const g = openGroup as GroupOrderAdmin;
        setActiveGroup(g);
        setInputDeliveryFee(g.delivery_fee || 0);
        setInputDiscount(g.discount_amount || 0);
        setRoundingRule((g.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');

        const { data: mItems } = await supabase.from('menu_items').select('*').eq('store_id', g.store_id);
        if (mItems) setMenuItems(mItems as MenuItem[]);

        const { data: subList } = await supabase
          .from('order_submissions')
          .select(`
            id, order_number, user_nickname, payment_method_name, sold_out_option,
            total_amount, final_amount, is_paid, signature_data, created_at,
            order_items (id, item_name, quantity, unit_price, custom_notes)
          `)
          .eq('group_order_id', g.id)
          .order('created_at', { ascending: false });

        if (subList) setSubmissions(subList as unknown as OrderSubmissionAdmin[]);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isUnlocked) fetchAdminData();
  }, [isUnlocked]);

  // Realtime 叮咚提醒
  useEffect(() => {
    if (!isUnlocked || !activeGroup) return;

    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_submissions' },
        (payload) => {
          playChimeSound();
          showToast(`🔔 叮咚！收到 ${payload.new.user_nickname} 的新訂單！`);
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUnlocked, activeGroup]);

  // 🔢 運費平攤算式 (計算 3 種規則)
  const calculateAdjustedAmount = (baseAmount: number) => {
    if (!submissions.length) return baseAmount;
    const netAdjustment = inputDeliveryFee - inputDiscount;
    const perPersonShare = netAdjustment / submissions.length;

    let roundedShare = 0;
    if (roundingRule === 'floor') roundedShare = Math.floor(perPersonShare);
    else if (roundingRule === 'ceil') roundedShare = Math.ceil(perPersonShare);
    else roundedShare = Math.round(perPersonShare);

    return Math.max(0, baseAmount + roundedShare);
  };

  // 套用平攤算式
  const handleApplyFeeSplit = async () => {
    if (!activeGroup || submissions.length === 0) return;

    for (const sub of submissions) {
      const adjustedFinal = calculateAdjustedAmount(sub.total_amount);
      await supabase
        .from('order_submissions')
        .update({ final_amount: adjustedFinal })
        .eq('id', sub.id);
    }

    await supabase
      .from('group_orders')
      .update({
        delivery_fee: inputDeliveryFee,
        discount_amount: inputDiscount,
        rounding_rule: roundingRule,
      })
      .eq('id', activeGroup.id);

    showToast(`🔢 平攤設定已更新！已重新試算全團個人金額。`);
    fetchAdminData();
  };

  // ✍️ 儲存個人手指簽名
  const handleSaveSignature = async (signatureData: string) => {
    if (!signatureTarget) return;

    await supabase
      .from('order_submissions')
      .update({ signature_data: signatureData, is_paid: true })
      .eq('id', signatureTarget.id);

    showToast(`✍️ 已存入 ${signatureTarget.user_nickname} 的對帳手繪簽名！`);
    setSignatureTarget(null);
    fetchAdminData();
  };

  // 📦 歸檔活動
  const handleArchiveGroup = async () => {
    if (!activeGroup) return;
    if (!confirm('📦 確定要歸檔此團購活動嗎？歸檔後可隨時一鍵重開新團。')) return;

    await supabase
      .from('group_orders')
      .update({ status: 'completed' })
      .eq('id', activeGroup.id);

    showToast('📦 團購活動已移入歷史歸檔！');
    fetchAdminData();
  };

  // 🔄 一鍵重開新團
  const handleReopenGroup = async (targetStoreId?: string) => {
    const sId = targetStoreId || activeGroup?.store_id;
    if (!sId) return;

    const { error } = await supabase.from('group_orders').insert({
      title: `新開團購活動`,
      store_id: sId,
      status: 'open',
      delivery_fee: 0,
      discount_amount: 0,
    });

    if (!error) {
      showToast('🎉 已成功以此店家一鍵開新團！');
      fetchAdminData();
    }
  };

  // 新增類別
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await supabase.from('categories').insert({ name: newCatName.trim(), sort_order: categories.length + 1 });
    setNewCatName('');
    showToast('➕ 已新增分類！');
    fetchAdminData();
  };

  // 新增店家
  const handleAddStore = async () => {
    if (!newStoreName.trim()) return;
    await supabase.from('stores').insert({
      name: newStoreName.trim(),
      category_id: newStoreCatId || null,
      is_active: true,
    });
    setNewStoreName('');
    showToast('➕ 已新增店家！');
    fetchAdminData();
  };

  // 單筆切換付款
  const handleTogglePaid = async (subId: string, currentStatus: boolean) => {
    await supabase.from('order_submissions').update({ is_paid: !currentStatus }).eq('id', subId);
    showToast(!currentStatus ? '✅ 標記為已付款' : '⏳ 標記為未付款');
    fetchAdminData();
  };

  // 批次勾選已付款
  const handleBatchMarkPaid = async () => {
    if (!selectedSubmissionIds.length) return;
    await supabase.from('order_submissions').update({ is_paid: true }).in('id', selectedSubmissionIds);
    setSelectedSubmissionIds([]);
    showToast('✅ 已批次標記已付款！');
    fetchAdminData();
  };

  // 私訊對帳單
  const handleCopyPersonalReceipt = (sub: OrderSubmissionAdmin) => {
    let text = `📢【咩nu 團購金額對帳】\n${sub.user_nickname} 你好！你點了：\n---\n`;
    sub.order_items.forEach((item) => {
      text += `• ${item.item_name} x ${item.quantity} ($${item.unit_price * item.quantity})\n`;
      if (item.custom_notes) text += `  備註：${item.custom_notes}\n`;
    });
    text += `---\n💰 個人小計：$${sub.final_amount} 元 (${sub.payment_method_name})\n`;
    text += `💳 付款狀態：${sub.is_paid ? '✅ 已收到款項' : '⏳ 待轉帳/付清'}\n感謝配合！🙏🙏`;

    navigator.clipboard.writeText(text);
    showToast(`📋 已複製 ${sub.user_nickname} 的個人對帳單！`);
  };

  const itemSummary = submissions.reduce((acc, sub) => {
    sub.order_items.forEach((item) => {
      const key = `${item.item_name} ${item.custom_notes ? `(${item.custom_notes})` : ''}`;
      acc[key] = (acc[key] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const grandTotal = submissions.reduce((sum, sub) => sum + sub.final_amount, 0);
  const paidTotal = submissions.filter((s) => s.is_paid).reduce((sum, sub) => sum + sub.final_amount, 0);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-12">
        <Header />
        <main className="max-w-md mx-auto w-full px-4 py-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 text-3xl mx-auto flex items-center justify-center font-bold border border-sky-100">
              👑
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">「咩nu」團長管理後台</h2>
              <p className="text-xs text-slate-400 mt-1">請輸入團長密碼解鎖權限</p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 pt-2">
              <input
                type="password"
                placeholder="輸入密碼 (預設：8888)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-2xl text-sm transition shadow-sm active:scale-95"
              >
                解鎖進入後台 ➔
              </button>
            </form>
          </div>
        </main>
        <div />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      <main className="max-w-md mx-auto px-4 pt-3 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-500 transition py-1"
          >
            ‹ 返回「咩nu」大廳
          </Link>
          <button
            onClick={() => setIsUnlocked(false)}
            className="text-xs text-slate-400 hover:text-red-500 transition font-semibold"
          >
            🔒 上鎖登出
          </button>
        </div>

        {/* 頁籤切換 Bar */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-2xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 rounded-xl transition ${activeTab === 'active' ? 'bg-white text-sky-600 shadow-xs' : ''}`}
          >
            即時對帳
          </button>
          <button
            onClick={() => setActiveTab('crud')}
            className={`py-2 rounded-xl transition ${activeTab === 'crud' ? 'bg-white text-sky-600 shadow-xs' : ''}`}
          >
            店家/菜單CRUD
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`py-2 rounded-xl transition ${activeTab === 'archive' ? 'bg-white text-sky-600 shadow-xs' : ''}`}
          >
            歷史歸檔 ({archivedGroups.length})
          </button>
        </div>

        {/* TAB 1: 當前即時對帳 */}
        {activeTab === 'active' && (
          <>
            {/* 儀表板 */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white rounded-3xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold flex items-center gap-2">
                  👑 團長旗艦儀表板
                </h2>
                <button
                  onClick={handleArchiveGroup}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded-lg text-slate-200 font-bold transition"
                >
                  📦 結案歸檔
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
                  <p className="text-[10px] text-slate-400 font-medium">總訂單 / 總金額</p>
                  <p className="text-lg font-extrabold text-sky-400 mt-0.5">
                    {submissions.length} 筆 / ${grandTotal}
                  </p>
                </div>
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
                  <p className="text-[10px] text-slate-400 font-medium">已實收進度</p>
                  <p className="text-lg font-extrabold text-green-400 mt-0.5">
                    ${paidTotal} 元
                  </p>
                </div>
              </div>
            </div>

            {/* 🔢 運費平攤與前後對比即時預覽表格 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700">🔢 運費平攤設定與前後對比預覽</h3>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold">外送費 (+)</label>
                  <input
                    type="number"
                    value={inputDeliveryFee}
                    onChange={(e) => setInputDeliveryFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold">折扣 (-)</label>
                  <input
                    type="number"
                    value={inputDiscount}
                    onChange={(e) => setInputDiscount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold">取整規則</label>
                  <select
                    value={roundingRule}
                    onChange={(e) => setRoundingRule(e.target.value as 'floor' | 'ceil' | 'round')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-1 text-xs font-bold"
                  >
                    <option value="floor">無條件捨去</option>
                    <option value="ceil">無條件進位</option>
                    <option value="round">四捨五入</option>
                  </select>
                </div>
              </div>

              {/* 前後對比預覽小表格 */}
              {submissions.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    算式試算對比預覽 (每人差額: ${calculateAdjustedAmount(0)} 元)
                  </p>
                  <div className="divide-y divide-slate-200 text-xs">
                    {submissions.slice(0, 3).map((sub) => (
                      <div key={sub.id} className="py-1 flex justify-between font-semibold">
                        <span className="text-slate-700">{sub.user_nickname}</span>
                        <span className="text-slate-500">
                          原價 ${sub.total_amount} ➔ <span className="text-sky-600 font-extrabold">${calculateAdjustedAmount(sub.total_amount)} 元</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyFeeSplit}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs"
              >
                套用算式並更新全團應收金額
              </button>
            </div>

            {/* 品項下單總數 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700">📦 全團品項下單總數量</h3>
              <div className="space-y-1.5 divide-y divide-slate-50">
                {Object.entries(itemSummary).map(([itemName, qty]) => (
                  <div key={itemName} className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1.5">
                    <span className="truncate mr-2">{itemName}</span>
                    <span className="bg-sky-100 text-sky-700 font-extrabold px-2 py-0.5 rounded-md shrink-0">
                      x {qty}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 團員訂單對帳清單 (含簽名核實按鈕) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">👥 團員訂單對帳清單</h3>
                <button
                  type="button"
                  onClick={handleBatchMarkPaid}
                  className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-xl border border-green-200"
                >
                  ☑️ 批次勾選已付款 ({selectedSubmissionIds.length})
                </button>
              </div>

              {submissions.map((sub) => {
                const isChecked = selectedSubmissionIds.includes(sub.id);
                return (
                  <div key={sub.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSubmissionIds([...selectedSubmissionIds, sub.id]);
                            else setSelectedSubmissionIds(selectedSubmissionIds.filter((id) => id !== sub.id));
                          }}
                          className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400"
                        />
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-base">{sub.user_nickname}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">#{sub.order_number} • {sub.payment_method_name}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTogglePaid(sub.id, sub.is_paid)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                          sub.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {sub.is_paid ? '✅ 已付款' : '⏳ 待付款'}
                      </button>
                    </div>

                    <div className="space-y-1">
                      {sub.order_items.map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between text-slate-600 font-medium">
                          <span>• {item.item_name} x {item.quantity}</span>
                          <span>${item.unit_price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* ✍️ 手指數位簽名縮圖預覽 */}
                    {sub.signature_data && (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">核實簽名:</span>
                        <img src={sub.signature_data} alt="簽名" className="h-6 object-contain" />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSignatureTarget(sub)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                        >
                          ✍️ 簽名核實
                        </button>
                        <button
                          type="button"
                          onClick={() => setChangeModalTarget({ nickname: sub.user_nickname, amount: sub.final_amount })}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                        >
                          💵 現金找零
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPersonalReceipt(sub)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-bold px-2 py-1 rounded-lg"
                        >
                          📋 私訊對帳
                        </button>
                      </div>

                      <span className="text-sky-600 text-sm font-extrabold">${sub.final_amount} 元</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: 店家/類別/菜單 CRUD */}
        {activeTab === 'crud' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700">🏷️ 新增全區類別</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="類別名稱 (如：炸物)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs font-bold"
                />
                <button type="button" onClick={handleAddCategory} className="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                  新增
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-700">🏪 新增店家</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="店家名稱 (如：50嵐)"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs font-bold"
                />
                <button type="button" onClick={handleAddStore} className="w-full bg-sky-500 text-white text-xs font-bold py-2 rounded-xl">
                  新增店家
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 歷史歸檔分頁 */}
        {activeTab === 'archive' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-700">📦 歷史歸檔團購紀錄</h3>
            {archivedGroups.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400">目前尚無歸檔的歷史團購喔！</div>
            ) : (
              archivedGroups.map((g) => (
                <div key={g.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{g.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">狀態：已完結結案</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReopenGroup(g.store_id)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-100"
                  >
                    🔄 一鍵開新團
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ✍️ 數位簽名核實 Modal */}
      {signatureTarget && (
        <SignatureModal
          nickname={signatureTarget.user_nickname}
          onClose={() => setSignatureTarget(null)}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* 💵 找零試算 Modal */}
      {changeModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-4 text-slate-800 animate-in zoom-in-95 duration-150 text-center">
            <h3 className="text-base font-extrabold">💵 現金找零試算器</h3>
            <p className="text-xs text-slate-500">
              {changeModalTarget.nickname} 應付金額：
              <span className="font-extrabold text-sky-600 text-sm">${changeModalTarget.amount} 元</span>
            </p>

            <input
              type="number"
              placeholder="例如：1000"
              value={receivedCash}
              onChange={(e) => setReceivedCash(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-center"
            />

            {Number(receivedCash) > 0 && (
              <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100">
                <p className="text-xs text-sky-700 font-bold">💰 應找零金額</p>
                <p className="text-xl font-extrabold text-sky-600 mt-0.5">
                  ${Math.max(0, Number(receivedCash) - changeModalTarget.amount)} 元
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setChangeModalTarget(null); setReceivedCash(''); }}
              className="w-full bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-xs"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}