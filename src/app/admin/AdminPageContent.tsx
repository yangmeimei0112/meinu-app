'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem, Category, CustomGroup, PaymentMethod, SoldOutOption } from '@/types/database';
import { AdminArchiveSection } from './AdminArchiveSection';
import { AdminCrudSection } from './AdminCrudSection';
import { AdminDashboardSection } from './AdminDashboardSection';
import { GroupOrderAdmin, OrderSubmissionAdmin, AdminViewMode } from './admin-types';
import { compressImageToWebP } from '@/lib/image-compress';
import { useTheme } from '@/lib/theme';
import { useAdminSound } from './hooks/useAdminSound';

// 子元件與彈窗
import AdminAuthLock from './components/AdminAuthLock';
import AdminStoreModal from './components/AdminStoreModal';
import AdminCategoryModal from './components/AdminCategoryModal';
import AdminProductModal from './components/AdminProductModal';
import AdminChangeModal from './components/AdminChangeModal';

// 🚀 隨選動態加載重型彈窗，顯著降低初始頁面 JS 傳輸大小 (Code Splitting)
const AdminPrintModal = dynamic(() => import('./AdminPrintModal'), { ssr: false });
const AdminManualOrderModal = dynamic(() => import('./AdminManualOrderModal'), { ssr: false });
const AdminBatchImportModal = dynamic(() => import('./AdminBatchImportModal'), { ssr: false });
const AdminGroupSettingsModal = dynamic(() => import('./AdminGroupSettingsModal'), { ssr: false });
const SignatureModal = dynamic(() => import('@/components/SignatureModal'), { ssr: false });

export default function AdminPageContent() {
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, playChimeSound, initAudio, toggleSound } = useAdminSound();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'crud' | 'archive'>('active');
  const [viewMode, setViewMode] = useState<AdminViewMode>('desktop');

  const selectedActiveGroupIdRef = useRef<string>('all');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const processedNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const sessionMountTimeRef = useRef<number>(Date.now());

  // 初始化時讀取 sessionStorage 中已通知過的訂單 ID
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('menu_app_processed_notifications');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          list.forEach((id: string) => processedNotificationIdsRef.current.add(id));
        }
      }
    } catch {}
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const notifyNewOrder = useCallback(
    (orderId: string, nickname: string, orderCreatedAt?: string | number) => {
      // 🛡️ 防線 1：檢查是否已在通知集合中（一筆訂單終身僅響鈴一次）
      if (processedNotificationIdsRef.current.has(orderId)) return;

      // 🛡️ 防線 2：時間戳過濾（若訂單建立時間早於進入後台的時間，一律視為歷史訂單直接登記，絕不響鈴）
      if (orderCreatedAt) {
        const orderTime = typeof orderCreatedAt === 'number' ? orderCreatedAt : new Date(orderCreatedAt).getTime();
        if (!isNaN(orderTime) && orderTime < sessionMountTimeRef.current - 3000) {
          processedNotificationIdsRef.current.add(orderId);
          return;
        }
      }

      processedNotificationIdsRef.current.add(orderId);
      knownOrderIdsRef.current.add(orderId);

      try {
        const arr = Array.from(processedNotificationIdsRef.current).slice(-300);
        sessionStorage.setItem('menu_app_processed_notifications', JSON.stringify(arr));
      } catch {}

      playChimeSound();
      showToast(`🔔 叮咚！收到 ${nickname || '團員'} 的新訂單！`);
    },
    [playChimeSound, showToast]
  );

  const [activeGroup, setActiveGroup] = useState<GroupOrderAdmin | null>(null);
  const [activeGroups, setActiveGroups] = useState<GroupOrderAdmin[]>([]);
  const [selectedActiveGroupId, setSelectedActiveGroupId] = useState<string>('all');

  useEffect(() => {
    selectedActiveGroupIdRef.current = selectedActiveGroupId;
  }, [selectedActiveGroupId]);

  const [archivedGroups, setArchivedGroups] = useState<GroupOrderAdmin[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [soldOutOptions, setSoldOutOptions] = useState<SoldOutOption[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<OrderSubmissionAdmin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ⚡ 根據選中的店家/活動在記憶體中即時過濾訂單，0ms 切換無重整或閃爍
  const submissions = useMemo(() => {
    if (!selectedActiveGroupId || selectedActiveGroupId === 'all') {
      return allSubmissions;
    }
    return allSubmissions.filter((s) => s.group_order_id === selectedActiveGroupId);
  }, [allSubmissions, selectedActiveGroupId]);

  // 初始化視圖模式偏好
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('menu_app_admin_view_mode') as AdminViewMode;
      if (savedMode === 'mobile' || savedMode === 'desktop') {
        setViewMode(savedMode);
      } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setViewMode('mobile');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleViewMode = (mode: AdminViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('menu_app_admin_view_mode', mode);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSound = () => {
    const next = toggleSound();
    showToast(next ? '🔔 已開啟新訂單叮咚提醒（試聽播放）' : '🔕 已靜音新訂單提示音效');
  };

  // 彈窗狀態管理
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeForm, setStoreForm] = useState({ name: '', category_id: '' });
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState<string>('');

  const [selectedCrudStoreId, setSelectedCrudStoreId] = useState<string | null>(null);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
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

  // 額外彈窗控制
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState<boolean>(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState<boolean>(false);

  const [signatureTarget, setSignatureTarget] = useState<OrderSubmissionAdmin | null>(null);
  const [changeModalTarget, setChangeModalTarget] = useState<{ nickname: string; amount: number } | null>(null);
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [selectedArchivedGroupId, setSelectedArchivedGroupId] = useState<string | null>(null);

  const [inputDeliveryFee, setInputDeliveryFee] = useState<number>(0);
  const [inputDiscount, setInputDiscount] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<'floor' | 'ceil' | 'round'>('floor');

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsUnlocked(false);
    showToast('🔒 已安全登出團長後台');
  };

  const fetchAdminData = useCallback(async (targetGroupId?: string, isSilent: boolean = true) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const [gRes, sRes, cRes, pRes, soRes, mRes] = await Promise.all([
        supabase.from('group_orders').select(`*, stores (*)`).order('created_at', { ascending: false }),
        supabase.from('stores').select('*').order('name', { ascending: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('payment_methods').select('*').order('name', { ascending: true }),
        supabase.from('sold_out_options').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('name', { ascending: true }),
      ]);

      setStores((sRes.data as Store[]) || []);
      setCategories((cRes.data as Category[]) || []);
      setPaymentMethods((pRes.data as PaymentMethod[]) || []);
      setSoldOutOptions((soRes.data as SoldOutOption[]) || []);
      setAllMenuItems((mRes.data as MenuItem[]) || []);

      if (gRes.data) {
        const allG = gRes.data;
        const openGroups = allG.filter((g) => g.status === 'open');
        const completedList = allG.filter((g) => g.status === 'completed');

        setArchivedGroups(completedList as GroupOrderAdmin[]);

        const effectiveGroupId = targetGroupId !== undefined ? targetGroupId : selectedActiveGroupIdRef.current;
        const openGroupIds = openGroups.map((g) => g.id);

        if (openGroupIds.length > 0) {
          const { data: allSubList, error: subErr } = await supabase
            .from('order_submissions')
            .select(`
              id, order_number, user_nickname, payment_method_name, sold_out_option,
              total_amount, final_amount, is_paid, signature_data, created_at, group_order_id,
              group_orders (title, stores (name)),
              order_items (id, item_name, quantity, unit_price, custom_notes)
            `)
            .in('group_order_id', openGroupIds)
            .order('created_at', { ascending: false });

          if (subErr) console.error('抓取訂單失敗:', subErr);

          const formattedSubs: OrderSubmissionAdmin[] = (allSubList || []).map((s: any) => ({
            ...s,
            store_name: s.group_orders?.stores?.name || s.group_orders?.title || '',
            order_items: s.order_items || [],
          }));

          (allSubList || []).forEach((s: any) => {
            knownOrderIdsRef.current.add(s.id);
            processedNotificationIdsRef.current.add(s.id);
          });

          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }

          const groupsWithStats: GroupOrderAdmin[] = openGroups.map((g: any) => {
            const gSubs = formattedSubs.filter((s) => s.group_order_id === g.id);
            return {
              ...g,
              order_count: gSubs.length,
              total_sales: gSubs.reduce((sum, s) => sum + s.final_amount, 0),
            };
          });

          setActiveGroups(groupsWithStats);

          let currentGroup: GroupOrderAdmin | null = null;
          if (effectiveGroupId && effectiveGroupId !== 'all') {
            currentGroup = groupsWithStats.find((g) => g.id === effectiveGroupId) || groupsWithStats[0];
          } else {
            currentGroup = groupsWithStats.find((g) => (g.order_count || 0) > 0) || groupsWithStats[0];
          }

          if (currentGroup) {
            setActiveGroup(currentGroup);
            setInputDeliveryFee(currentGroup.delivery_fee || 0);
            setInputDiscount(currentGroup.discount_amount || 0);
            setRoundingRule((currentGroup.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
          }

          setAllSubmissions(formattedSubs);
        } else {
          setActiveGroups([]);
          setActiveGroup(null);
          setAllSubmissions([]);
        }
      }
    } catch (err) {
      console.error('抓取資料失敗:', err);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) fetchAdminData(undefined, false);
  }, [isUnlocked, fetchAdminData]);

  // Realtime 與 3 秒智慧雙保險輪詢
  useEffect(() => {
    if (!isUnlocked) return;

    const channelName = `admin-rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_submissions' },
        (payload) => {
          const newSub = payload.new as { id?: string; user_nickname?: string; created_at?: string };
          if (newSub?.id) {
            notifyNewOrder(newSub.id, newSub.user_nickname || '團員', newSub.created_at);
          }
          fetchAdminData(selectedActiveGroupIdRef.current, true);
          setTimeout(() => {
            fetchAdminData(selectedActiveGroupIdRef.current, true);
          }, 500);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_submissions' },
        (payload) => {
          const updatedSub = payload.new as any;
          if (updatedSub?.id) {
            setAllSubmissions((prev) =>
              prev.map((s) =>
                s.id === updatedSub.id
                  ? {
                      ...s,
                      ...updatedSub,
                      order_items: s.order_items,
                      store_name: s.store_name,
                    }
                  : s
              )
            );
            fetchAdminData(selectedActiveGroupIdRef.current, true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'order_submissions' },
        (payload) => {
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setAllSubmissions((prev) => prev.filter((s) => s.id !== deletedId));
            setSelectedSubmissionIds((prev) => prev.filter((id) => id !== deletedId));
            knownOrderIdsRef.current.delete(deletedId);
          }
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_orders' },
        () => {
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      )
      .subscribe();

    const pollingTimer = setInterval(async () => {
      try {
        const { data: latestSubs } = await supabase
          .from('order_submissions')
          .select('id, user_nickname, created_at, group_order_id')
          .order('created_at', { ascending: false });

        if (latestSubs && !isInitialLoadRef.current) {
          const currentIdSet = new Set(latestSubs.map((s) => s.id));
          let hasNew = false;
          let hasDeleted = false;

          for (const sub of latestSubs) {
            const orderTime = sub.created_at ? new Date(sub.created_at).getTime() : 0;
            if (orderTime < sessionMountTimeRef.current - 3000) {
              processedNotificationIdsRef.current.add(sub.id);
              continue;
            }

            if (!processedNotificationIdsRef.current.has(sub.id)) {
              hasNew = true;
              notifyNewOrder(sub.id, sub.user_nickname, orderTime);
            }
          }

          for (const knownId of Array.from(knownOrderIdsRef.current)) {
            if (!currentIdSet.has(knownId)) {
              hasDeleted = true;
              knownOrderIdsRef.current.delete(knownId);
            }
          }

          if (hasNew || hasDeleted) {
            fetchAdminData(selectedActiveGroupIdRef.current, true);
          }
        }
      } catch (err) {
        console.error('智慧輪詢更新失敗:', err);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingTimer);
    };
  }, [isUnlocked, fetchAdminData, notifyNewOrder]);

  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedWebPDataUrl = await compressImageToWebP(file);
        setStoreImagePreview(compressedWebPDataUrl);
        const res = await fetch(compressedWebPDataUrl);
        const blob = await res.blob();
        const compressedFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.webp`, {
          type: 'image/webp',
        });
        setStoreImageFile(compressedFile);
      } catch (err) {
        console.error('WebP 壓縮失敗，使用原始檔案', err);
        setStoreImageFile(file);
        setStoreImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleOpenStoreModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({ name: store.name, category_id: store.category_id || '' });
      setStoreImagePreview(store.image_url || '');
      setStoreImageFile(null);
    } else {
      setEditingStore(null);
      setStoreForm({ name: '', category_id: categories[0]?.id || '' });
      setStoreImagePreview('');
      setStoreImageFile(null);
    }
    setIsStoreModalOpen(true);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadingImage(true);
      let imageUrl = editingStore?.image_url || null;

      if (storeImageFile) {
        const fileExt = storeImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('stores').upload(fileName, storeImageFile);
        if (uploadError) {
          console.error('上傳圖片錯誤:', uploadError);
          alert('圖片上傳失敗，請確認 Supabase Storage 是否已建立名稱為 "stores" 的 Public Bucket');
          setUploadingImage(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('stores').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const payload = {
        name: storeForm.name,
        image_url: imageUrl,
        category_id: storeForm.category_id || null,
        is_active: true,
      };

      if (editingStore) {
        const { error } = await supabase.from('stores').update(payload).eq('id', editingStore.id);
        if (error) throw error;
        showToast('✅ 店家資訊與照片已更新！');
      } else {
        const { error } = await supabase.from('stores').insert([payload]);
        if (error) throw error;
        showToast('🎉 新增店家成功！');
      }

      setIsStoreModalOpen(false);
      setEditingStore(null);
      setStoreForm({ name: '', category_id: '' });
      setStoreImageFile(null);
      setStoreImagePreview('');
      fetchAdminData();
    } catch (err: any) {
      console.error('儲存店家失敗:', err);
      alert(`儲存店家失敗: ${err?.message || err}`);
    } finally {
      setUploadingImage(false);
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

  const handleCreatePaymentMethod = async () => {
    const payload = {
      name: `新付款方式 ${paymentMethods.length + 1}`,
      account_info: null,
      is_active: true,
    };
    const { error } = await supabase.from('payment_methods').insert([payload]);
    if (error) {
      showToast('❌ 新增付款方式失敗');
      return;
    }
    showToast('➕ 已新增付款方式');
    fetchAdminData();
  };

  const handleSavePaymentMethod = async (id: string, payload: { name: string; account_info: string | null }) => {
    const { error } = await supabase.from('payment_methods').update(payload).eq('id', id);
    if (error) {
      showToast('❌ 儲存付款方式失敗');
      return;
    }
    showToast('✅ 付款方式已更新');
    fetchAdminData();
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('確定要刪除此付款方式嗎？')) return;
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    if (error) {
      showToast('❌ 刪除付款方式失敗');
      return;
    }
    showToast('🗑️ 付款方式已刪除');
    fetchAdminData();
  };

  const handleTogglePaymentMethodActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('payment_methods').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      showToast('❌ 切換付款方式狀態失敗');
      return;
    }
    showToast(!currentStatus ? '✅ 已啟用付款方式' : '⏸️ 已停用付款方式');
    fetchAdminData();
  };

  const handleCreateSoldOutOption = async () => {
    const nextOrder = soldOutOptions.length > 0 ? Math.max(...soldOutOptions.map((x) => x.sort_order)) + 1 : 1;
    const payload = { title: '請團長聯繫我', sort_order: nextOrder };
    const { error } = await supabase.from('sold_out_options').insert([payload]);
    if (error) {
      showToast('❌ 新增缺貨備案失敗');
      return;
    }
    showToast('➕ 已新增缺貨備案');
    fetchAdminData();
  };

  const handleSaveSoldOutOption = async (id: string, title: string) => {
    const { error } = await supabase.from('sold_out_options').update({ title: title.trim() }).eq('id', id);
    if (error) {
      showToast('❌ 儲存缺貨備案失敗');
      return;
    }
    showToast('✅ 缺貨備案已更新');
    fetchAdminData();
  };

  const handleDeleteSoldOutOption = async (id: string) => {
    if (!confirm('確定要刪除此缺貨備案嗎？')) return;
    const { error } = await supabase.from('sold_out_options').delete().eq('id', id);
    if (error) {
      showToast('❌ 刪除缺貨備案失敗');
      return;
    }
    showToast('🗑️ 缺貨備案已刪除');
    fetchAdminData();
  };

  const handleMoveSoldOutOption = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...soldOutOptions].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((x) => x.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[targetIndex];

    await supabase.from('sold_out_options').update({ sort_order: target.sort_order }).eq('id', current.id);
    await supabase.from('sold_out_options').update({ sort_order: current.sort_order }).eq('id', target.id);
    fetchAdminData();
  };

  const handleOpenItemModal = (item?: MenuItem, storeId?: string) => {
    if (storeId) {
      setSelectedCrudStoreId(storeId);
    }
    if (item) {
      setSelectedCrudStoreId(item.store_id);
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
    const targetStoreId = selectedCrudStoreId || editingProduct?.store_id;
    if (!targetStoreId || !productForm.name.trim()) {
      alert('請確認已選擇店家並填寫餐點名稱！');
      return;
    }
    try {
      const payload = {
        store_id: targetStoreId,
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
      fetchAdminData();
    } catch (err: any) {
      console.error('儲存餐點失敗:', err);
      alert(`儲存餐點失敗：${err?.message || err?.details || '請確認 Supabase menu_items 欄位'}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('確定要刪除此品項嗎？')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', productId);
      if (error) throw error;
      showToast('🗑️ 品項已刪除');
      fetchAdminData();
    } catch (err) {
      console.error('刪除品項失敗:', err);
    }
  };

  const handleToggleProductStatus = async (productId: string) => {
    try {
      const item = allMenuItems.find((m) => m.id === productId);
      if (!item) return;
      const { error } = await supabase.from('menu_items').update({ is_sold_out: !item.is_sold_out }).eq('id', productId);
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      console.error('切換狀態失敗:', err);
    }
  };

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
    const targetId = signatureTarget.id;
    const targetNickname = signatureTarget.user_nickname;
    setSignatureTarget(null);

    setAllSubmissions((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, signature_data: signatureData, is_paid: true } : s))
    );
    showToast(`✍️ 已存入 ${targetNickname} 的對帳手繪簽名！`);

    const { error } = await supabase
      .from('order_submissions')
      .update({ signature_data: signatureData, is_paid: true })
      .eq('id', targetId);

    if (error) {
      console.error('儲存簽名失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current);
      showToast('❌ 儲存簽名失敗');
    }
  };

  const handleArchiveGroup = async () => {
    if (!activeGroup) return;
    if (!confirm('📦 確定要歸檔此團購活動嗎？歸檔後可隨時一鍵重開新團。')) return;

    await supabase.from('group_orders').update({ status: 'completed' }).eq('id', activeGroup.id);
    showToast('📦 團購活動已移入歷史歸檔！');
    fetchAdminData();
  };

  const handleReopenGroup = async (group: GroupOrderAdmin) => {
    const { data: newGroup, error } = await supabase
      .from('group_orders')
      .insert({
        title: `${group.title} (新開團)`,
        store_id: group.store_id,
        status: 'open',
        announcement: group.announcement,
        delivery_fee: group.delivery_fee,
        discount_amount: group.discount_amount,
        rounding_rule: group.rounding_rule,
        enable_min_threshold: group.enable_min_threshold,
        min_threshold_amount: group.min_threshold_amount,
        enable_countdown: group.enable_countdown,
        enable_budget_limit: group.enable_budget_limit,
        budget_limit_amount: group.budget_limit_amount,
      })
      .select('*')
      .single();

    if (!error && newGroup) {
      showToast('🔄 已成功一鍵發起新團購活動！');
      setActiveTab('active');
      fetchAdminData();
    } else {
      alert('建立新團購活動失敗');
    }
  };

  const handleDeleteArchivedGroup = async (groupId: string, title: string) => {
    if (
      !confirm(
        `🗑️ 確定要刪除歷史活動「${title}」嗎？\n此動作將一併清除該活動底下的所有歷史訂單紀錄，且無法復原。`
      )
    ) {
      return;
    }

    try {
      // 1. 取得該活動所有訂單 ID
      const { data: subs } = await supabase
        .from('order_submissions')
        .select('id')
        .eq('group_order_id', groupId);

      if (subs && subs.length > 0) {
        const subIds = subs.map((s) => s.id);
        await supabase.from('order_items').delete().in('submission_id', subIds);
        await supabase.from('order_submissions').delete().in('id', subIds);
      }

      const { error } = await supabase.from('group_orders').delete().eq('id', groupId);
      if (error) throw error;

      showToast(`🗑️ 已刪除歷史活動「${title}」`);
      fetchAdminData();
    } catch (err: any) {
      console.error('刪除歷史活動失敗:', err);
      showToast(`❌ 刪除失敗：${err?.message || err}`);
    }
  };

  const handleBatchDeleteArchivedGroups = async (groupIds: string[]) => {
    if (!groupIds.length) return;
    const count = groupIds.length;

    if (
      !confirm(
        `🗑️ 確定要批次刪除選取的 ${count} 個歷史活動嗎？\n此動作將一併清除這些活動底下的所有歷史訂單紀錄，且無法復原。`
      )
    ) {
      return;
    }

    try {
      // 1. 取得所有選取活動的訂單 ID
      const { data: subs } = await supabase
        .from('order_submissions')
        .select('id')
        .in('group_order_id', groupIds);

      if (subs && subs.length > 0) {
        const subIds = subs.map((s) => s.id);
        await supabase.from('order_items').delete().in('submission_id', subIds);
        await supabase.from('order_submissions').delete().in('id', subIds);
      }

      const { error } = await supabase.from('group_orders').delete().in('id', groupIds);
      if (error) throw error;

      showToast(`🗑️ 已批次刪除 ${count} 個歷史活動`);
      fetchAdminData();
    } catch (err: any) {
      console.error('批次刪除歷史活動失敗:', err);
      showToast(`❌ 批次刪除失敗：${err?.message || err}`);
    }
  };

  const handleSaveGroupSettings = async (updatedData: {
    title: string;
    store_id: string;
    announcement: string | null;
    enable_min_threshold: boolean;
    min_threshold_amount: number;
    enable_countdown: boolean;
    cutoff_time: string | null;
    enable_budget_limit: boolean;
    budget_limit_amount: number;
  }) => {
    if (activeGroup) {
      const { error } = await supabase.from('group_orders').update(updatedData).eq('id', activeGroup.id);
      if (error) throw error;
      showToast('✅ 團購活動設定與公告已更新！');
    } else {
      const { error } = await supabase.from('group_orders').insert([{ ...updatedData, status: 'open' }]);
      if (error) throw error;
      showToast('🎉 新團購活動已成功發起！');
    }
    fetchAdminData();
  };

  const handleToggleGroupStatus = async (newStatus: 'open' | 'closed') => {
    if (!activeGroup) return;
    const { error } = await supabase.from('group_orders').update({ status: newStatus }).eq('id', activeGroup.id);

    if (!error) {
      setActiveGroup({ ...activeGroup, status: newStatus });
      showToast(`活動已切換為：${newStatus === 'closed' ? '🔒 已截單 (停止收單)' : '🟢 開放收單中'}`);
    }
  };

  const handleTogglePaid = async (subId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    setAllSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, is_paid: newStatus } : s)));
    showToast(newStatus ? '✅ 標記為已付款' : '⏳ 標記為未付款');

    const { error } = await supabase.from('order_submissions').update({ is_paid: newStatus }).eq('id', subId);

    if (error) {
      console.error('更新付款狀態失敗:', error);
      setAllSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, is_paid: currentStatus } : s)));
      showToast('❌ 更新付款狀態失敗，已復原狀態');
    }
  };

  const handleBatchMarkPaid = async () => {
    if (!selectedSubmissionIds.length) return;
    const idsToUpdate = [...selectedSubmissionIds];
    setSelectedSubmissionIds([]);

    setAllSubmissions((prev) => prev.map((s) => (idsToUpdate.includes(s.id) ? { ...s, is_paid: true } : s)));
    showToast(`✅ 已批次標記 ${idsToUpdate.length} 筆訂單為已付款！`);

    const { error } = await supabase.from('order_submissions').update({ is_paid: true }).in('id', idsToUpdate);

    if (error) {
      console.error('批次標記失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current);
      showToast('❌ 批次更新付款狀態失敗');
    }
  };

  const handleDeleteOrder = async (subId: string, nickname: string, orderNumber: string) => {
    if (
      !confirm(
        `🗑️ 確定要刪除「${nickname}」的訂單 #${orderNumber} 嗎？\n此動作將一併刪除該訂單的所有餐點明細，且無法復原。`
      )
    ) {
      return;
    }

    setAllSubmissions((prev) => prev.filter((s) => s.id !== subId));
    setSelectedSubmissionIds((prev) => prev.filter((id) => id !== subId));
    showToast(`🗑️ 已刪除 ${nickname} 的訂單`);

    try {
      await supabase.from('order_items').delete().eq('submission_id', subId);
      const { error } = await supabase.from('order_submissions').delete().eq('id', subId);
      if (error) throw error;
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    } catch (err) {
      console.error('刪除訂單失敗:', err);
      showToast('❌ 刪除訂單失敗，正在重新同步...');
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    }
  };

  const handleBatchDeleteOrders = async () => {
    if (!selectedSubmissionIds.length) return;
    const idsToDelete = [...selectedSubmissionIds];
    const count = idsToDelete.length;

    if (
      !confirm(
        `🗑️ 確定要批次刪除選取的 ${count} 筆訂單嗎？\n此動作將一併刪除這些訂單的所有餐點明細，且無法復原。`
      )
    ) {
      return;
    }

    setAllSubmissions((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
    setSelectedSubmissionIds([]);
    showToast(`🗑️ 已批次刪除 ${count} 筆訂單`);

    try {
      await supabase.from('order_items').delete().in('submission_id', idsToDelete);
      const { error } = await supabase.from('order_submissions').delete().in('id', idsToDelete);
      if (error) throw error;
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    } catch (err) {
      console.error('批次刪除訂單失敗:', err);
      showToast('❌ 批次刪除失敗，正在重新同步...');
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    }
  };

  const handleCopyPersonalReceipt = async (sub: OrderSubmissionAdmin) => {
    let text = `📢【咩nu 團購金額對帳】\n${sub.user_nickname} 你好！你點了：\n---\n`;
    (sub.order_items || []).forEach((item) => {
      text += `• ${item.item_name} x ${item.quantity} ($${item.unit_price * item.quantity})\n`;
      if (item.custom_notes) text += `   備註：${item.custom_notes}\n`;
    });
    text += `---\n💰 個人小計：$${sub.final_amount} 元 (${sub.payment_method_name})\n`;
    text += `💳 付款狀態：${sub.is_paid ? '✅ 已收到款項' : '⏳ 待轉帳/付清'}\n感謝配合！🙏🙏`;

    try {
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(`📋 已複製 ${sub.user_nickname} 的個人對帳單！`);
    } catch (err) {
      console.error('複製失敗:', err);
      showToast('⚠️ 複製失敗，請手動選擇文字複製');
    }
  };

  const handleCopyStoreOrderText = async () => {
    const storeName = stores.find((s) => s.id === activeGroup?.store_id)?.name || '店家';
    let text = `【${storeName} 團購訂單明細】\n---\n`;
    const totalCount = Object.values(itemSummary).reduce((a, b) => a + b, 0);
    Object.entries(itemSummary).forEach(([name, qty], idx) => {
      text += `${idx + 1}. ${name} x ${qty}\n`;
    });
    text += `---\n總計：${submissions.length} 人點餐，共 ${totalCount} 份，總金額 $${grandTotal} 元。\n謝謝！`;

    try {
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('📋 已複製店家下單格式文字！');
    } catch (err) {
      console.error(err);
      showToast('⚠️ 複製失敗');
    }
  };

  const handleCopyUnpaidReminder = async () => {
    const unpaidList = submissions.filter((s) => !s.is_paid);
    if (unpaidList.length === 0) {
      showToast('🎉 全員皆已付款完成，無需催款！');
      return;
    }

    let text = `📢【團購付款提醒】餐點已訂好/抵達囉！請以下朋友記得轉帳或付款給團長：\n---\n`;
    unpaidList.forEach((sub) => {
      text += `❌ ${sub.user_nickname}：$${sub.final_amount} 元 (${sub.payment_method_name})\n`;
    });
    const defaultPayment = paymentMethods[0];
    if (defaultPayment?.account_info) {
      text += `---\n💳 團長收款帳號：${defaultPayment.name} - ${defaultPayment.account_info}\n`;
    }
    text += `轉帳後請通知團長核對，感謝各位配合！🙏🙏`;

    try {
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('📢 已複製群組未付款催款文字！');
    } catch (err) {
      console.error(err);
      showToast('⚠️ 複製失敗');
    }
  };

  const handleExportOrdersCSV = () => {
    if (submissions.length === 0) {
      showToast('⚠️ 目前沒有任何訂單可匯出');
      return;
    }

    let csvContent = '單號,訂購人,點餐明細,付款方式,缺貨備案,金額,付款狀態,送單時間\n';
    submissions.forEach((sub) => {
      const itemsText = (sub.order_items || [])
        .map((i) => `${i.item_name} x ${i.quantity}${i.custom_notes ? ` (${i.custom_notes})` : ''}`)
        .join('; ');
      const isPaidText = sub.is_paid ? '已付款' : '未付款';
      const dateText = new Date(sub.created_at).toLocaleString('zh-TW');
      csvContent += `"${sub.order_number}","${sub.user_nickname}","${itemsText}","${sub.payment_method_name}","${sub.sold_out_option || ''}","${sub.final_amount}","${isPaidText}","${dateText}"\n`;
    });

    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meinu_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📊 訂單 CSV 表格已成功下載！');
  };

  const itemSummary: Record<string, number> = {};
  let grandTotal = 0;
  let paidTotal = 0;

  for (let i = 0; i < submissions.length; i++) {
    const sub = submissions[i];
    grandTotal += sub.final_amount;
    if (sub.is_paid) paidTotal += sub.final_amount;

    const items = sub.order_items || [];
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const key = `${item.item_name} ${item.custom_notes ? `(${item.custom_notes})` : ''}`;
      itemSummary[key] = (itemSummary[key] || 0) + item.quantity;
    }
  }

  // 🔒 密碼鎖定畫面
  if (!isUnlocked) {
    return (
      <AdminAuthLock
        onUnlockSuccess={() => {
          sessionMountTimeRef.current = Date.now();
          isInitialLoadRef.current = true;
          setIsUnlocked(true);
        }}
        onInitAudio={initAudio}
      />
    );
  }

  const isDesktop = viewMode === 'desktop';

  return (
    <div
      className={`min-h-screen pb-20 transition-colors duration-200 ${
        isDesktop ? 'bg-slate-100/70 dark:bg-[#0B0F17]' : 'bg-slate-200/60 dark:bg-[#06090E]'
      }`}
    >
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 backdrop-blur-xs flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 頂部管理工具列 */}
      <div className="bg-white/80 dark:bg-[#131B2B]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-4 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition"
            >
              ‹ 返回點餐大廳
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {activeGroup?.title || '咩nu 團購活動後台'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 音效開關與試聽按鈕 */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border ${
                  isSoundEnabled
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isSoundEnabled ? '新訂單音效提醒：已開啟（點擊靜意）' : '新訂單音效提醒：已靜音（點擊開啟）'}
              >
                <span>{isSoundEnabled ? '🔔 叮咚提醒: 開' : '🔕 叮咚提醒: 關'}</span>
              </button>

              {isSoundEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    initAudio();
                    playChimeSound(true);
                    showToast('🔔 正在試聽新訂單提示音效...');
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition cursor-pointer"
                  title="點擊測試播放新訂單叮咚鈴聲"
                >
                  🔊 試聽
                </button>
              )}
            </div>

            {/* 視圖切換 (手機比例 / 電腦比例) */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleToggleViewMode('desktop')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  isDesktop
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                💻 電腦比例
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('mobile')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  !isDesktop
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📱 手機比例
              </button>
            </div>

            {/* 暗色/亮色主題切換按鈕 */}
            <button
              type="button"
              onClick={toggleTheme}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title={theme === 'dark' ? '點擊切換為亮色主題' : '點擊切換為暗色主題'}
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span>{theme === 'dark' ? '暗色主題' : '亮色主題'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              🔒 登出
            </button>
          </div>
        </div>
      </div>

      {/* 主頁籤切換 */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex bg-slate-200/80 dark:bg-[#131B2B] p-1.5 rounded-2xl max-w-md mx-auto sm:mx-0 shadow-inner border border-transparent dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>👑 進行中團購</span>
            {submissions.length > 0 && (
              <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crud')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'crud'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>🏪 店家與菜單管理</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📦 歷史歸檔</span>
            {archivedGroups.length > 0 && (
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {archivedGroups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className={`mx-auto p-4 transition-all duration-200 ${isDesktop ? 'max-w-7xl' : 'max-w-md'}`}>
        {loading ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs animate-pulse">
            正在同步最新團購資料...
          </div>
        ) : (
          <>
            {activeTab === 'active' && (
              <AdminDashboardSection
                viewMode={viewMode}
                groupOrder={activeGroup}
                activeGroups={activeGroups}
                selectedActiveGroupId={selectedActiveGroupId}
                onSelectActiveGroup={(groupId) => {
                  setSelectedActiveGroupId(groupId);
                  selectedActiveGroupIdRef.current = groupId;
                  if (groupId !== 'all') {
                    const g = activeGroups.find((item) => item.id === groupId);
                    if (g) {
                      setActiveGroup(g);
                      setInputDeliveryFee(g.delivery_fee || 0);
                      setInputDiscount(g.discount_amount || 0);
                      setRoundingRule((g.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
                    }
                  } else if (activeGroups.length > 0) {
                    const g = activeGroups.find((item) => (item.order_count || 0) > 0) || activeGroups[0];
                    if (g) {
                      setActiveGroup(g);
                      setInputDeliveryFee(g.delivery_fee || 0);
                      setInputDiscount(g.discount_amount || 0);
                      setRoundingRule((g.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
                    }
                  }
                }}
                submissions={submissions}
                itemSummary={itemSummary}
                grandTotal={grandTotal}
                paidTotal={paidTotal}
                inputDeliveryFee={inputDeliveryFee}
                inputDiscount={inputDiscount}
                roundingRule={roundingRule}
                selectedSubmissionIds={selectedSubmissionIds}
                setSelectedSubmissionIds={setSelectedSubmissionIds}
                calculateAdjustedAmount={calculateAdjustedAmount}
                setInputDeliveryFee={setInputDeliveryFee}
                setInputDiscount={setInputDiscount}
                setRoundingRule={setRoundingRule}
                handleApplyFeeSplit={handleApplyFeeSplit}
                handleBatchMarkPaid={handleBatchMarkPaid}
                handleTogglePaid={handleTogglePaid}
                setSignatureTarget={setSignatureTarget}
                setChangeModalTarget={setChangeModalTarget}
                handleCopyPersonalReceipt={handleCopyPersonalReceipt}
                handleCopyStoreOrderText={handleCopyStoreOrderText}
                handleCopyUnpaidReminder={handleCopyUnpaidReminder}
                handleExportOrdersCSV={handleExportOrdersCSV}
                handleOpenPrintModal={() => setIsPrintModalOpen(true)}
                handleOpenManualOrderModal={() => setIsManualOrderModalOpen(true)}
                handleOpenGroupSettingsModal={() => setIsGroupSettingsModalOpen(true)}
                handleArchiveGroup={handleArchiveGroup}
                handleToggleGroupStatus={handleToggleGroupStatus}
                handleDeleteOrder={handleDeleteOrder}
                handleBatchDeleteOrders={handleBatchDeleteOrders}
              />
            )}

            {activeTab === 'crud' && (
              <AdminCrudSection
                viewMode={viewMode}
                stores={stores}
                categories={categories}
                menuItems={allMenuItems}
                paymentMethods={paymentMethods}
                soldOutOptions={soldOutOptions}
                selectedStudioStoreId={selectedCrudStoreId}
                onSelectStudioStore={(storeId) => setSelectedCrudStoreId(storeId)}
                onCreateStore={() => handleOpenStoreModal()}
                onEditStore={(store: Store) => handleOpenStoreModal(store)}
                onDeleteStore={handleDeleteStore}
                onCreateCategory={() => {
                  setEditingCat(null);
                  setCatNameInput('');
                  setIsCatModalOpen(true);
                }}
                onMoveCategory={(id: string, direction: 'up' | 'down') => {
                  const category = categories.find((c) => c.id === id);
                  if (category) handleMoveCategory(category, direction);
                }}
                onDeleteCategory={handleDeleteCategory}
                onCreateMenuItem={(storeId) => handleOpenItemModal(undefined, storeId)}
                onEditMenuItem={(item: MenuItem) => handleOpenItemModal(item)}
                onOpenBatchImportModal={(storeId) => {
                  if (storeId) setSelectedCrudStoreId(storeId);
                  setIsBatchImportModalOpen(true);
                }}
                onDeleteMenuItem={handleDeleteProduct}
                onToggleMenuItemActive={(id: string) => handleToggleProductStatus(id)}
                onCreatePaymentMethod={handleCreatePaymentMethod}
                onDeletePaymentMethod={handleDeletePaymentMethod}
                onTogglePaymentMethodActive={handleTogglePaymentMethodActive}
                onUpdatePaymentMethod={(id: string, field: 'name' | 'account_info', value: string | null) => {
                  setPaymentMethods((prev) =>
                    prev.map((method) =>
                      method.id === id
                        ? {
                            ...method,
                            [field]: value,
                          }
                        : method
                    )
                  );
                }}
                onSavePaymentMethod={handleSavePaymentMethod}
                onCreateSoldOutOption={handleCreateSoldOutOption}
                onDeleteSoldOutOption={handleDeleteSoldOutOption}
                onMoveSoldOutOption={handleMoveSoldOutOption}
                onUpdateSoldOutOption={(id: string, title: string) => {
                  setSoldOutOptions((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)));
                }}
                onSaveSoldOutOption={handleSaveSoldOutOption}
                onUpdateCategory={(id: string, field: 'name', value: string) => {
                  if (field === 'name' && typeof value === 'string') {
                    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name: value } : cat)));
                  }
                }}
              />
            )}

            {activeTab === 'archive' && (
              <AdminArchiveSection
                viewMode={viewMode}
                archivedGroups={archivedGroups}
                selectedArchivedGroupId={selectedArchivedGroupId}
                setSelectedArchivedGroupId={setSelectedArchivedGroupId}
                handleReopenGroup={handleReopenGroup}
                handleDeleteArchivedGroup={handleDeleteArchivedGroup}
                handleBatchDeleteArchivedGroups={handleBatchDeleteArchivedGroups}
              />
            )}
          </>
        )}
      </main>

      {/* 友善列印檢視 Modal (動態加載) */}
      {isPrintModalOpen && (
        <AdminPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          groupOrder={activeGroup}
          submissions={submissions}
          itemSummary={itemSummary}
          grandTotal={grandTotal}
        />
      )}

      {/* 團長代點餐 Modal (動態加載) */}
      {isManualOrderModalOpen && (
        <AdminManualOrderModal
          isOpen={isManualOrderModalOpen}
          onClose={() => setIsManualOrderModalOpen(false)}
          groupOrder={activeGroup}
          menuItems={allMenuItems}
          paymentMethods={paymentMethods}
          soldOutOptions={soldOutOptions}
          onOrderAdded={fetchAdminData}
        />
      )}

      {/* 菜單 CSV 批量匯入 Modal (動態加載) */}
      {isBatchImportModalOpen && (
        <AdminBatchImportModal
          isOpen={isBatchImportModalOpen}
          onClose={() => setIsBatchImportModalOpen(false)}
          storeId={selectedCrudStoreId}
          storeName={stores.find((s) => s.id === selectedCrudStoreId)?.name || '當前店家'}
          onImportSuccess={fetchAdminData}
        />
      )}

      {/* 團購活動與公告進階設定 Modal (動態加載) */}
      {isGroupSettingsModalOpen && (
        <AdminGroupSettingsModal
          isOpen={isGroupSettingsModalOpen}
          onClose={() => setIsGroupSettingsModalOpen(false)}
          groupOrder={activeGroup}
          stores={stores}
          onSaveGroupSettings={handleSaveGroupSettings}
        />
      )}

      {/* 店家增修 Modal */}
      <AdminStoreModal
        isOpen={isStoreModalOpen}
        editingStore={editingStore}
        categories={categories}
        storeForm={storeForm}
        setStoreForm={setStoreForm}
        storeImagePreview={storeImagePreview}
        uploadingImage={uploadingImage}
        onClose={() => setIsStoreModalOpen(false)}
        onSaveStore={handleSaveStore}
        onImageChange={handleStoreImageChange}
      />

      {/* 分類增修 Modal */}
      <AdminCategoryModal
        isOpen={isCatModalOpen}
        editingCat={editingCat}
        catNameInput={catNameInput}
        setCatNameInput={setCatNameInput}
        onClose={() => setIsCatModalOpen(false)}
        onSaveCategory={handleSaveCategory}
      />

      {/* 餐點品項與規格 Modal */}
      <AdminProductModal
        isOpen={isProductModalOpen}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        productCustomGroups={productCustomGroups}
        setProductCustomGroups={setProductCustomGroups}
        onClose={() => setIsProductModalOpen(false)}
        onSaveProduct={handleSaveProduct}
        onAddCustomGroup={handleAddCustomGroup}
        onRemoveCustomGroup={handleRemoveCustomGroup}
        onAddOptionToGroup={handleAddOptionToGroup}
        onRemoveOptionFromGroup={handleRemoveOptionFromGroup}
      />

      {/* 簽名預覽 Modal (動態加載) */}
      {signatureTarget && (
        <SignatureModal
          nickname={signatureTarget.user_nickname}
          onClose={() => setSignatureTarget(null)}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* 現金找零試算 Modal */}
      <AdminChangeModal
        changeModalTarget={changeModalTarget}
        receivedCash={receivedCash}
        setReceivedCash={setReceivedCash}
        onClose={() => {
          setChangeModalTarget(null);
          setReceivedCash('');
        }}
      />
    </div>
  );
}