'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import SignatureModal from '@/components/SignatureModal';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem, Category, CustomGroup, CustomOption } from '@/types/database';

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
  rounding_rule: string;
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
  const [loading, setLoading] = useState<boolean>(true);

  // 🏪 店家 CRUD Modal State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeForm, setStoreForm] = useState({ name: '', image_url: '', category_id: '' });

  // 🏷️ 類別 CRUD Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState<string>('');

  // 📋 菜單/品項與動態客製化選項 CRUD State
  const [selectedCrudStoreId, setSelectedCrudStoreId] = useState<string | null>(null);
  const [crudMenuItems, setCrudMenuItems] = useState<MenuItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    stock_quantity: '',
    is_sold_out: false,
  });
  const [productCustomGroups, setProductCustomGroups] = useState<CustomGroup[]>([]);

  // ✍️ 簽名 Modal Target
  const [signatureTarget, setSignatureTarget] = useState<OrderSubmissionAdmin | null>(null);

  // 💵 找零 Modal Target
  const [changeModalTarget, setChangeModalTarget] = useState<{ nickname: string; amount: number } | null>(null);
  const [receivedCash, setReceivedCash] = useState<string>('');

  // ☑️ 多選對帳
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);

  // 🔢 平攤設定與取整規則
  const [inputDeliveryFee, setInputDeliveryFee] = useState<number>(0);
  const [inputDiscount, setInputDiscount] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<'floor' | 'ceil' | 'round'>('floor');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const playChimeSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch((err) => console.error('播放音效失敗：', err));
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
    if (storeList) {
      setStores(storeList as Store[]);
      if (storeList.length > 0 && !selectedCrudStoreId) {
        setSelectedCrudStoreId(storeList[0].id);
      }
    }

    const { data: groupList } = await supabase.from('group_orders').select('*').order('created_at', { ascending: false });

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

  // 切換選擇的店家時載入菜單
  useEffect(() => {
    if (selectedCrudStoreId) {
      supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', selectedCrudStoreId)
        .then(({ data }) => {
          if (data) setCrudMenuItems(data as MenuItem[]);
        });
    }
  }, [selectedCrudStoreId]);

  useEffect(() => {
    if (isUnlocked) fetchAdminData();
  }, [isUnlocked]);

  // Realtime 叮咚提醒
  useEffect(() => {
    if (!isUnlocked || !activeGroup) return;

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_submissions' }, (payload) => {
        playChimeSound();
        showToast(`🔔 叮咚！收到 ${payload.new.user_nickname} 的新訂單！`);
        fetchAdminData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUnlocked, activeGroup]);

  // ================= 🏪 店家 CRUD 處理 =================
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: storeForm.name,
        image_url: storeForm.image_url || null,
        category_id: storeForm.category_id || null,
        is_active: true,
      };

      if (editingStore) {
        const { error } = await supabase.from('stores').update(payload).eq('id', editingStore.id);
        if (error) throw error;
        showToast('✅ 店家資訊已更新！');
      } else {
        const { error } = await supabase.from('stores').insert([payload]);
        if (error) throw error;
        showToast('🎉 新增店家成功！');
      }
      setIsStoreModalOpen(false);
      setEditingStore(null);
      setStoreForm({ name: '', image_url: '', category_id: '' });
      fetchAdminData();
    } catch (err) {
      console.error('儲存店家失敗:', err);
      alert('儲存店家失敗');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('⚠️ 確定要刪除此店家嗎？此動作無法復原！')) return;
    try {
      const { error } = await supabase.from('stores').delete().eq('id', storeId);
      if (error) throw error;
      showToast('🗑️ 店家已刪除');
      fetchAdminData();
    } catch (err) {
      console.error('刪除店家失敗:', err);
      alert('刪除失敗');
    }
  };

  // ================= 🏷️ 類別 CRUD 與排序處理 =================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    try {
      if (editingCat) {
        const { error } = await supabase.from('categories').update({ name: catNameInput.trim() }).eq('id', editingCat.id);
        if (error) throw error;
        showToast('✅ 類別名稱已修改！');
      } else {
        const { error } = await supabase.from('categories').insert([{ name: catNameInput.trim(), sort_order: categories.length + 1 }]);
        if (error) throw error;
        showToast('➕ 已新增類別！');
      }
      setIsCatModalOpen(false);
      setEditingCat(null);
      setCatNameInput('');
      fetchAdminData();
    } catch (err) {
      console.error('儲存類別失敗:', err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('確定要刪除此類別嗎？')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) throw error;
      showToast('🗑️ 類別已刪除');
      fetchAdminData();
    } catch (err) {
      console.error('刪除類別失敗:', err);
    }
  };

  const handleMoveCategory = async (cat: Category, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === cat.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const targetCat = categories[targetIndex];
    await supabase.from('categories').update({ sort_order: targetCat.sort_order }).eq('id', cat.id);
    await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', targetCat.id);
    fetchAdminData();
  };

  // ================= 📋 餐點與動態客製化選項 CRUD 處理 =================
  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingProduct(item);
      setProductForm({
        name: item.name,
        price: item.price.toString(),
        description: item.description || '',
        stock_quantity: item.stock_quantity?.toString() || '',
        is_sold_out: item.is_sold_out,
      });
      setProductCustomGroups(item.custom_groups || []);
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', price: '', description: '', stock_quantity: '', is_sold_out: false });
      setProductCustomGroups([]);
    }
    setIsProductModalOpen(true);
  };

  const handleAddCustomGroup = () => {
    const newGroup: CustomGroup = {
      id: Date.now().toString(),
      title: '',
      type: 'single',
      options: [{ id: Date.now().toString() + '_1', name: '', price_adjustment: 0 }],
    };
    setProductCustomGroups([...productCustomGroups, newGroup]);
  };

  const handleRemoveCustomGroup = (groupId: string) => {
    setProductCustomGroups(productCustomGroups.filter((g) => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    setProductCustomGroups(
      productCustomGroups.map((g) =>
        g.id === groupId
          ? { ...g, options: [...g.options, { id: Date.now().toString(), name: '', price_adjustment: 0 }] }
          : g
      )
    );
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setProductCustomGroups(
      productCustomGroups.map((g) =>
        g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
      )
    );
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrudStoreId || !productForm.name.trim()) return;
    try {
      const payload = {
        store_id: selectedCrudStoreId,
        name: productForm.name.trim(),
        price: parseFloat(productForm.price) || 0,
        description: productForm.description.trim() || null,
        stock_quantity: productForm.stock_quantity ? parseInt(productForm.stock_quantity) : null,
        is_sold_out: productForm.is_sold_out,
        custom_groups: productCustomGroups,
      };

      if (editingProduct) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        showToast('✅ 餐點與客製化選項已更新！');
      } else {
        const { error } = await supabase.from('menu_items').insert([payload]);
        if (error) throw error;
        showToast('🎉 新增餐點成功！');
      }
      setIsProductModalOpen(false);
      const { data } = await supabase.from('menu_items').select('*').eq('store_id', selectedCrudStoreId);
      if (data) setCrudMenuItems(data as MenuItem[]);
    } catch (err) {
      console.error('儲存餐點失敗:', err);
      alert('儲存餐點失敗');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('確定要刪除此品項嗎？')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', productId);
      if (error) throw error;
      showToast('🗑️ 品項已刪除');
      if (selectedCrudStoreId) {
        const { data } = await supabase.from('menu_items').select('*').eq('store_id', selectedCrudStoreId);
        if (data) setCrudMenuItems(data as MenuItem[]);
      }
    } catch (err) {
      console.error('刪除品項失敗:', err);
    }
  };

  const handleToggleProductStatus = async (prod: MenuItem) => {
    try {
      const { error } = await supabase.from('menu_items').update({ is_sold_out: !prod.is_sold_out }).eq('id', prod.id);
      if (error) throw error;
      if (selectedCrudStoreId) {
        const { data } = await supabase.from('menu_items').select('*').eq('store_id', selectedCrudStoreId);
        if (data) setCrudMenuItems(data as MenuItem[]);
      }
    } catch (err) {
      console.error('切換狀態失敗:', err);
    }
  };

  // 🔢 運費平攤算式
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

  const handleApplyFeeSplit = async () => {
    if (!activeGroup || submissions.length === 0) return;

    for (const sub of submissions) {
      const adjustedFinal = calculateAdjustedAmount(sub.total_amount);
      await supabase.from('order_submissions').update({ final_amount: adjustedFinal }).eq('id', sub.id);
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

  const handleSaveSignature = async (signatureData: string) => {
    if (!signatureTarget) return;

    await supabase.from('order_submissions').update({ signature_data: signatureData, is_paid: true }).eq('id', signatureTarget.id);

    showToast(`✍️ 已存入 ${signatureTarget.user_nickname} 的對帳手繪簽名！`);
    setSignatureTarget(null);
    fetchAdminData();
  };

  const handleArchiveGroup = async () => {
    if (!activeGroup) return;
    if (!confirm('📦 確定要歸檔此團購活動嗎？歸檔後可隨時一鍵重開新團。')) return;

    await supabase.from('group_orders').update({ status: 'completed' }).eq('id', activeGroup.id);

    showToast('📦 團購活動已移入歷史歸檔！');
    fetchAdminData();
  };

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

  const handleTogglePaid = async (subId: string, currentStatus: boolean) => {
    await supabase.from('order_submissions').update({ is_paid: !currentStatus }).eq('id', subId);
    showToast(!currentStatus ? '✅ 標記為已付款' : '⏳ 標記為未付款');
    fetchAdminData();
  };

  const handleBatchMarkPaid = async () => {
    if (!selectedSubmissionIds.length) return;
    await supabase.from('order_submissions').update({ is_paid: true }).in('id', selectedSubmissionIds);
    setSelectedSubmissionIds([]);
    showToast('✅ 已批次標記已付款！');
    fetchAdminData();
  };

  const handleCopyPersonalReceipt = (sub: OrderSubmissionAdmin) => {
    let text = `📢【咩nu 團購金額對帳】\n${sub.user_nickname} 你好！你點了：\n---\n`;
    sub.order_items.forEach((item) => {
      text += `• ${item.item_name} x ${item.quantity} ($${item.unit_price * item.quantity})\n`;
      if (item.custom_notes) text += `   備註：${item.custom_notes}\n`;
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
            菜單/店家CRUD
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

            {/* 🔢 運費平攤設定與前後對比 */}
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

            {/* 團員訂單對帳清單 */}
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

        {/* TAB 2: 店家/類別/菜單與客製化選項 CRUD */}
        {activeTab === 'crud' && (
          <div className="space-y-4">
            
            {/* 1. 店家管理區塊 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">🏪 合作店家管理 (CRUD)</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStore(null);
                    setStoreForm({ name: '', image_url: '', category_id: '' });
                    setIsStoreModalOpen(true);
                  }}
                  className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
                >
                  ＋ 新增店家
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    onClick={() => setSelectedCrudStoreId(store.id)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      selectedCrudStoreId === store.id ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{store.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">ID: {store.id}</p>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStore(store);
                          setStoreForm({
                            name: store.name,
                            image_url: store.image_url || '',
                            category_id: store.category_id || '',
                          });
                          setIsStoreModalOpen(true);
                        }}
                        className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 hover:text-sky-600 font-bold"
                      >
                        ✏️ 編輯
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStore(store.id)}
                        className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 font-bold"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. 全區類別與排序管理 */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">🏷️ 全區菜單類別與排序管理</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCat(null);
                    setCatNameInput('');
                    setIsCatModalOpen(true);
                  }}
                  className="bg-sky-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
                >
                  ＋ 新增類別
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {categories.map((cat, idx) => (
                  <div key={cat.id} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveCategory(cat, 'up')}
                        className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 disabled:opacity-30 font-bold"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1}
                        onClick={() => handleMoveCategory(cat, 'down')}
                        className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 disabled:opacity-30 font-bold"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat);
                          setCatNameInput(cat.name);
                          setIsCatModalOpen(true);
                        }}
                        className="text-xs text-slate-500 hover:text-sky-600 font-bold px-1"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-bold px-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 選定店家的餐點與動態客製化選項管理 */}
            {selectedCrudStoreId && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-700">📋 餐點品項與動態客製化選項</h3>
                  <button
                    type="button"
                    onClick={() => handleOpenItemModal()}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
                  >
                    ＋ 新增餐點
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {crudMenuItems.map((prod) => (
                    <div key={prod.id} className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-slate-800">{prod.name}</p>
                          <p className="text-[10px] text-sky-600 font-bold">${prod.price} 元</p>
                        </div>
                        {prod.custom_groups && prod.custom_groups.length > 0 ? (
                          <p className="text-[10px] text-slate-400 mt-1">
                            含 {prod.custom_groups.length} 個客製化區塊: {prod.custom_groups.map((g) => g.title).join(', ')}
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-0.5">無客製化選項 (點擊直接加入購物車)</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleProductStatus(prod)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            !prod.is_sold_out ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {!prod.is_sold_out ? '販售中' : '已完售'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenItemModal(prod)}
                          className="text-xs text-slate-500 hover:text-sky-600 font-bold px-1"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-bold px-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {crudMenuItems.length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4">此店家尚無建立任何菜單品項</p>
                  )}
                </div>
              </div>
            )}
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

      {/* 🏪 店家新增/編輯 Modal 視窗 */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-center">
              {editingStore ? '✏️ 編輯店家資訊' : '🏪 新增合作店家'}
            </h3>

            <form onSubmit={handleSaveStore} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">店家名稱</label>
                <input
                  type="text"
                  required
                  placeholder="例如：50嵐"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">圖片網址 (Image URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={storeForm.image_url}
                  onChange={(e) => setStoreForm({ ...storeForm, image_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ 類別新增/編輯 Modal 視窗 */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-center">
              {editingCat ? '✏️ 編輯類別名稱' : '🏷️ 新增類別'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">類別名稱</label>
                <input
                  type="text"
                  required
                  placeholder="例如：手搖飲料"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📋 餐點與動態客製化選項 Modal 視窗 */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 space-y-4 text-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-center">
              {editingProduct ? '✏️ 編輯餐點與客製化選項' : '➕ 新增餐點'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">餐點名稱</label>
                <input
                  type="text"
                  required
                  placeholder="例如：珍珠奶茶"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">基本價格 ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="例如：50"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">庫存數量 (選填)</label>
                  <input
                    type="number"
                    placeholder="不限數量"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">餐點描述 (選填)</label>
                <input
                  type="text"
                  placeholder="例如：香濃好喝人氣款"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold mt-1"
                />
              </div>

              {/* 🛠️ 動態客製化選項邏輯設定區 */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800">🛠️ 動態客製化選項區塊</span>
                  <button
                    type="button"
                    onClick={handleAddCustomGroup}
                    className="bg-sky-50 text-sky-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-sky-200 hover:bg-sky-100"
                  >
                    ＋ 新增客製化區塊
                  </button>
                </div>

                {productCustomGroups.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    未設定客製化區塊 (前台將視為基本款，點擊直接加入購物車)
                  </p>
                ) : (
                  productCustomGroups.map((group) => (
                    <div key={group.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="區塊標題 (例：甜度、加料)"
                          value={group.title}
                          onChange={(e) =>
                            setProductCustomGroups(
                              productCustomGroups.map((g) => (g.id === group.id ? { ...g, title: e.target.value } : g))
                            )
                          }
                          className="flex-1 bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold"
                        />
                        <select
                          value={group.type}
                          onChange={(e) =>
                            setProductCustomGroups(
                              productCustomGroups.map((g) =>
                                g.id === group.id ? { ...g, type: e.target.value as 'single' | 'any' | 'limit' } : g
                              )
                            )
                          }
                          className="bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold"
                        >
                          <option value="single">單選 (Must 1)</option>
                          <option value="any">多選不限 (Any)</option>
                          <option value="limit">限制數量 (Limit N)</option>
                        </select>

                        {group.type === 'limit' && (
                          <input
                            type="number"
                            placeholder="N"
                            value={group.limit_number || 1}
                            onChange={(e) =>
                              setProductCustomGroups(
                                productCustomGroups.map((g) =>
                                  g.id === group.id ? { ...g, limit_number: Number(e.target.value) } : g
                                )
                              )
                            }
                            className="w-14 bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-center"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveCustomGroup(group.id)}
                          className="text-xs text-red-500 hover:bg-red-50 p-1.5 rounded-lg font-bold"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* 子選項列表 */}
                      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                        {group.options.map((opt) => (
                          <div key={opt.id} className="flex gap-2 items-center">
                            <input
                              type="text"
                              required
                              placeholder="選項名稱 (例：半糖)"
                              value={opt.name}
                              onChange={(e) =>
                                setProductCustomGroups(
                                  productCustomGroups.map((g) =>
                                    g.id === group.id
                                      ? {
                                          ...g,
                                          options: g.options.map((o) =>
                                            o.id === opt.id ? { ...o, name: e.target.value } : o
                                          ),
                                        }
                                      : g
                                  )
                                )
                              }
                              className="flex-1 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold"
                            />
                            <input
                              type="number"
                              placeholder="加價 ($)"
                              value={opt.price_adjustment}
                              onChange={(e) =>
                                setProductCustomGroups(
                                  productCustomGroups.map((g) =>
                                    g.id === group.id
                                      ? {
                                          ...g,
                                          options: g.options.map((o) =>
                                            o.id === opt.id ? { ...o, price_adjustment: Number(e.target.value) } : o
                                          ),
                                        }
                                      : g
                                  )
                                )
                              }
                              className="w-20 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromGroup(group.id, opt.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOptionToGroup(group.id)}
                          className="text-[10px] text-sky-600 font-bold hover:underline"
                        >
                          ＋ 新增子選項
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs"
                >
                  儲存餐點
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              onClick={() => {
                setChangeModalTarget(null);
                setReceivedCash('');
              }}
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