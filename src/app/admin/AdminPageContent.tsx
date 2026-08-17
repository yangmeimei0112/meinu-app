'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import SignatureModal from '@/components/SignatureModal';
import { supabase } from '@/lib/supabase';
import { Store, MenuItem, Category, CustomGroup, PaymentMethod, SoldOutOption } from '@/types/database';
import { AdminArchiveSection } from './AdminArchiveSection';
import { AdminCrudSection } from '@/app/admin/AdminCrudSection';
import { AdminDashboardSection } from './AdminDashboardSection';
import { GroupOrderAdmin, OrderSubmissionAdmin, AdminViewMode } from './admin-types';
import AdminPrintModal from './AdminPrintModal';
import AdminManualOrderModal from './AdminManualOrderModal';
import AdminBatchImportModal from './AdminBatchImportModal';
import AdminGroupSettingsModal from './AdminGroupSettingsModal';
import { compressImageToWebP } from '@/lib/image-compress';
import { generateMathChallenge, getLockoutDurationSec, securityDelay } from '@/lib/security';
import { useTheme } from '@/lib/theme';

export default function AdminPageContent() {
  const { theme, toggleTheme } = useTheme();
  const [passcode, setPasscode] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'crud' | 'archive'>('active');
  const [viewMode, setViewMode] = useState<AdminViewMode>('desktop');
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // 🔔 即時音效狀態 Ref 保持最新值，防止閉包陷阱
  const isSoundEnabledRef = useRef<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioObjRef = useRef<HTMLAudioElement | null>(null);
  const selectedActiveGroupIdRef = useRef<string>('all');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const processedNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const lastNotificationTimeRef = useRef<number>(0);
  // 🛡️ 記錄後台進入/解鎖的絕對時間戳（任何早於此時間點的訂單均為歷史訂單，絕不重複發送通知）
  const sessionMountTimeRef = useRef<number>(Date.now());

  // 初始化時預先載入音效檔案並讀取 sessionStorage 中已通知過的訂單 ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio('/notification.mp3');
        audio.preload = 'auto';
        audioObjRef.current = audio;
      } catch {}
    }

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

  const notifyNewOrder = (orderId: string, nickname: string, orderCreatedAt?: string | number) => {
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

    // 立即將此單號鎖定至已通知清單（不可撤回）
    processedNotificationIdsRef.current.add(orderId);
    knownOrderIdsRef.current.add(orderId);

    // 持久化至 sessionStorage，避免同分頁重新整理時重複通知
    try {
      const arr = Array.from(processedNotificationIdsRef.current).slice(-300);
      sessionStorage.setItem('menu_app_processed_notifications', JSON.stringify(arr));
    } catch {}

    playChimeSound();
    showToast(`🔔 叮咚！收到 ${nickname || '團員'} 的新訂單！`);
  };

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

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

  // 初始化視圖模式偏好與音效偏好
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('menu_app_admin_view_mode') as AdminViewMode;
      if (savedMode === 'mobile' || savedMode === 'desktop') {
        setViewMode(savedMode);
      } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setViewMode('mobile');
      }

      const savedSound = localStorage.getItem('menu_app_admin_sound_enabled');
      if (savedSound !== null) {
        setIsSoundEnabled(savedSound === 'true');
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
    const nextSound = !isSoundEnabled;
    setIsSoundEnabled(nextSound);
    isSoundEnabledRef.current = nextSound;
    try {
      localStorage.setItem('menu_app_admin_sound_enabled', String(nextSound));
    } catch (e) {
      console.error(e);
    }
    if (nextSound) {
      initAudio();
      playChimeSound();
    }
    showToast(nextSound ? '🔔 已開啟新訂單叮咚提醒（試聽播放）' : '🔕 已靜音新訂單提示音效');
  };

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

  // 額外彈窗控制：列印、人工代點、CSV 批次匯入、團購設定
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const initAudio = () => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    } catch (e) {
      console.error('初始化 AudioContext 失敗：', e);
    }
  };

  // 🔔 全域點擊/觸控自動激活瀏覽器音效播放權限 (Autoplay Policy Unlock)
  useEffect(() => {
    const unlockAudio = () => {
      initAudio();
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const triggerBellOscillators = (ctx: AudioContext) => {
    try {
      const now = ctx.currentTime;

      // 叮 (Ding: 587.33Hz / D5 - 亮麗圓潤三角波)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.5, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // 咚 (Dong: 880.00Hz / A5 - 清脆正弦波)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.6, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.8);
    } catch (err) {
      console.error('震盪器發聲失敗:', err);
    }
  };

  const playSynthesizedChime = () => {
    try {
      initAudio();
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => triggerBellOscillators(ctx)).catch(() => {});
      } else {
        triggerBellOscillators(ctx);
      }
    } catch (e) {
      console.error('播放合成鈴聲失敗：', e);
    }
  };

  const playChimeSound = () => {
    if (!isSoundEnabledRef.current) return;

    // 🛡️ 嚴格防重放節流閥：若 2.5 秒內已發聲過，絕不重複發聲
    const now = Date.now();
    if (now - lastNotificationTimeRef.current < 2500) {
      return;
    }
    lastNotificationTimeRef.current = now;

    try {
      // 優先使用標準 HTML5 Audio 播放真實 MP3 鈴聲
      if (audioObjRef.current) {
        audioObjRef.current.currentTime = 0;
        const playPromise = audioObjRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play error, falling back to Web Audio:', err);
            // 只有當 MP3 播放失敗時，才以 Web Audio API 作為備用發聲
            playSynthesizedChime();
          });
        }
      } else {
        playSynthesizedChime();
      }
    } catch (e) {
      console.warn('playChimeSound fallback:', e);
      playSynthesizedChime();
    }
  };

  // 🛡️ 資安防護：防撞庫與防暴力破解密碼機制
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [captchaChallenge, setCaptchaChallenge] = useState<{ question: string; answer: number }>(() => generateMathChallenge());
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    const rawLockout = typeof window !== 'undefined' ? (sessionStorage.getItem('menu_app_admin_lockout') || localStorage.getItem('menu_app_admin_lockout')) : null;
    if (rawLockout) {
      const lockUntil = Number(rawLockout);
      const diff = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
      if (diff > 0) setLockoutRemaining(diff);
    }
  }, []);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem('menu_app_admin_lockout');
            localStorage.removeItem('menu_app_admin_lockout');
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // 🛡️ 伺服端 Session 自動恢復檢驗
  useEffect(() => {
    fetch('/api/admin/verify')
      .then((res) => {
        if (res.ok) {
          setIsUnlocked(true);
          initAudio();
        }
      })
      .catch(() => {});
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return;

    if (lockoutRemaining > 0) {
      alert(`🔒 系統處於防撞庫安全鎖定中，請於 ${lockoutRemaining} 秒後再試！`);
      return;
    }

    // 當錯誤次數 >= 2 時強制驗證動態人機挑戰
    if (failedAttempts >= 2) {
      if (!captchaInput.trim() || Number(captchaInput.trim()) !== captchaChallenge.answer) {
        alert('⚠️ 人機驗證算術答案錯誤！請重新計算輸入。');
        setCaptchaChallenge(generateMathChallenge());
        setCaptchaInput('');
        return;
      }
    }

    setIsVerifying(true);

    try {
      // 🛡️ 透過伺服端 API 進行時序安全與環境變數密碼驗證
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionMountTimeRef.current = Date.now();
        isInitialLoadRef.current = true;
        setIsUnlocked(true);
        setFailedAttempts(0);
        setCaptchaInput('');
        initAudio();
        try {
          sessionStorage.removeItem('menu_app_admin_failed');
          sessionStorage.removeItem('menu_app_admin_lockout');
          localStorage.removeItem('menu_app_admin_lockout');
        } catch {}
      } else {
        const nextFail = failedAttempts + 1;
        setFailedAttempts(nextFail);
        setCaptchaChallenge(generateMathChallenge());
        setCaptchaInput('');

        const lockSec = data.lockedUntilSec || getLockoutDurationSec(nextFail);
        if (lockSec > 0) {
          const lockUntil = Date.now() + lockSec * 1000;
          try {
            sessionStorage.setItem('menu_app_admin_lockout', String(lockUntil));
            localStorage.setItem('menu_app_admin_lockout', String(lockUntil));
          } catch {}
          setLockoutRemaining(lockSec);
        }

        alert(data.message || '❌ 密碼錯誤！');
      }
    } catch (err) {
      console.error(err);
      alert('連線伺服器驗證失敗，請檢查網路連線');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsUnlocked(false);
    showToast('🔒 已安全登出團長後台');
  };

  const fetchAdminData = async (targetGroupId?: string, isSilent: boolean = true) => {
    if (!isSilent) {
      setLoading(true);
    }

    try {
      // 🚀 並行發送 6 個查詢，消除瀑布流延遲，後台載入速度提升 3 倍
      const [catRes, storeRes, paymentRes, soldOutRes, menuRes, groupRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('stores').select('*'),
        supabase.from('payment_methods').select('*').order('name', { ascending: true }),
        supabase.from('sold_out_options').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*'),
        supabase.from('group_orders').select('*').order('created_at', { ascending: false }),
      ]);

      if (catRes.data) setCategories(catRes.data as Category[]);

      if (storeRes.data) {
        setStores(storeRes.data as Store[]);
        if (storeRes.data.length > 0 && !selectedCrudStoreId) {
          setSelectedCrudStoreId(storeRes.data[0].id);
        }
      }

      if (paymentRes.data) setPaymentMethods(paymentRes.data as PaymentMethod[]);
      if (soldOutRes.data) setSoldOutOptions(soldOutRes.data as SoldOutOption[]);
      if (menuRes.data) setCrudMenuItems(menuRes.data as MenuItem[]);

      if (groupRes.data) {
        const openGroups = groupRes.data.filter((g) => g.status !== 'completed');
        const completedList = groupRes.data.filter((g) => g.status === 'completed');

        setArchivedGroups(completedList as GroupOrderAdmin[]);

        const effectiveGroupId = targetGroupId !== undefined ? targetGroupId : selectedActiveGroupIdRef.current;
        const openGroupIds = openGroups.map((g) => g.id);

        if (openGroupIds.length > 0) {
          // 抓取所有進行中活動的訂單（關聯 group_orders 與 stores 名稱）
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

          // 累計記錄所有已知訂單 ID，並將現存訂單全部標記為已處理（杜絕任何重複通知）
          (allSubList || []).forEach((s: any) => {
            knownOrderIdsRef.current.add(s.id);
            processedNotificationIdsRef.current.add(s.id);
          });

          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }

          // 計算各團購活動的訂單數與總營業額
          const groupsWithStats: GroupOrderAdmin[] = openGroups.map((g: any) => {
            const gSubs = formattedSubs.filter((s) => s.group_order_id === g.id);
            return {
              ...g,
              order_count: gSubs.length,
              total_sales: gSubs.reduce((sum, s) => sum + s.final_amount, 0),
            };
          });

          setActiveGroups(groupsWithStats);

          // 決定平攤設定與活動狀態的主參考 group
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

          // 儲存全量活動訂單至記憶體狀態（submissions 由 useMemo 自動即時篩選）
          setAllSubmissions(formattedSubs);
        } else {
          setActiveGroups([]);
          setActiveGroup(null);
          setAllSubmissions([]);
        }
      }
    } catch (err) {
      console.error('抓取後台資料失敗:', err);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

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
    if (isUnlocked) fetchAdminData(undefined, false);
  }, [isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) return;

    // 1. 即時訂單、明細與活動變更監聽頻道 (WebSocket 即時廣播，使用隨機唯一頻道名防止連線殘留)
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
          // 雙重延遲更新，確保關聯的 order_items 批次寫入後立即渲染出完整餐點明細
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
            // ⚡ 0ms 立即樂觀移除該筆訂單與選取狀態
            setAllSubmissions((prev) => prev.filter((s) => s.id !== deletedId));
            setSelectedSubmissionIds((prev) => prev.filter((id) => id !== deletedId));
            knownOrderIdsRef.current.delete(deletedId);
          }
          // ⚡ 即時同步重新抓取與計算各進行中團購的即時訂單數與總營業額
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

    // 2. 智慧雙保險輪詢 (Smart High-Frequency Polling - 3 秒)
    // 即使背景分頁降頻或 WebSocket 休眠，也能在 3 秒內自動捕獲「新訂單送達」或「前台使用者取消訂單」
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

          // 檢查是否有新送達的訂單
          for (const sub of latestSubs) {
            const orderTime = sub.created_at ? new Date(sub.created_at).getTime() : 0;
            // 建立時間早於進入頁面時間的訂單標記為已處理
            if (orderTime < sessionMountTimeRef.current - 3000) {
              processedNotificationIdsRef.current.add(sub.id);
              continue;
            }

            if (!processedNotificationIdsRef.current.has(sub.id)) {
              hasNew = true;
              notifyNewOrder(sub.id, sub.user_nickname, orderTime);
            }
          }

          // 檢查是否有前台使用者取消 / 刪除的訂單（已存在於 knownOrderIdsRef 但不在目前 DB 中）
          for (const knownId of Array.from(knownOrderIdsRef.current)) {
            if (!currentIdSet.has(knownId)) {
              hasDeleted = true;
              knownOrderIdsRef.current.delete(knownId);
              // 注意：processedNotificationIdsRef 終身保留，防止歷史訂單重複響鈴
            }
          }

          // 若有新訂單或有訂單被取消，立即同步更新後台資料與營業統計
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
  }, [isUnlocked]);

  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedWebPDataUrl = await compressImageToWebP(file);
        setStoreImagePreview(compressedWebPDataUrl);
        const res = await fetch(compressedWebPDataUrl);
        const blob = await res.blob();
        const compressedFile = new File(
          [blob],
          `${file.name.replace(/\.[^/.]+$/, '')}.webp`,
          { type: 'image/webp' }
        );
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
    } catch (err: any) {
      console.error('儲存餐點失敗:', err);
      alert(`儲存餐點失敗：${err?.message || err?.details || '請確認 Supabase menu_items 包含 custom_groups 欄位與 RLS 權限'}`);
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

    // ⚡ 樂觀更新 (Optimistic UI)：立即更新該筆訂單簽名與付款狀態，無縫銜接
    setAllSubmissions((prev) =>
      prev.map((s) =>
        s.id === targetId ? { ...s, signature_data: signatureData, is_paid: true } : s
      )
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
      const { error } = await supabase
        .from('group_orders')
        .update(updatedData)
        .eq('id', activeGroup.id);
      if (error) throw error;
      showToast('✅ 團購活動設定與公告已更新！');
    } else {
      const { error } = await supabase
        .from('group_orders')
        .insert([{ ...updatedData, status: 'open' }]);
      if (error) throw error;
      showToast('🎉 新團購活動已成功發起！');
    }
    fetchAdminData();
  };

  const handleToggleGroupStatus = async (newStatus: 'open' | 'closed') => {
    if (!activeGroup) return;
    const { error } = await supabase
      .from('group_orders')
      .update({ status: newStatus })
      .eq('id', activeGroup.id);

    if (!error) {
      setActiveGroup({ ...activeGroup, status: newStatus });
      showToast(`活動已切換為：${newStatus === 'closed' ? '🔒 已截單 (停止收單)' : '🟢 開放收單中'}`);
    }
  };

  const handleTogglePaid = async (subId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // ⚡ 樂觀更新 (Optimistic UI)：立即直接變更按鈕狀態，絕不重整或閃爍畫面
    setAllSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, is_paid: newStatus } : s))
    );
    showToast(newStatus ? '✅ 標記為已付款' : '⏳ 標記為未付款');

    // 背景非同步同步至資料庫
    const { error } = await supabase
      .from('order_submissions')
      .update({ is_paid: newStatus })
      .eq('id', subId);

    if (error) {
      console.error('更新付款狀態失敗:', error);
      // 若連線或寫入失敗則回滾狀態
      setAllSubmissions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, is_paid: currentStatus } : s))
      );
      showToast('❌ 更新付款狀態失敗，已復原狀態');
    }
  };

  const handleBatchMarkPaid = async () => {
    if (!selectedSubmissionIds.length) return;
    const idsToUpdate = [...selectedSubmissionIds];
    setSelectedSubmissionIds([]);

    // ⚡ 樂觀更新 (Optimistic UI)：即時在前端記憶體更新所有勾選項目的按鈕狀態
    setAllSubmissions((prev) =>
      prev.map((s) => (idsToUpdate.includes(s.id) ? { ...s, is_paid: true } : s))
    );
    showToast(`✅ 已批次標記 ${idsToUpdate.length} 筆訂單為已付款！`);

    // 背景非同步同步至資料庫
    const { error } = await supabase
      .from('order_submissions')
      .update({ is_paid: true })
      .in('id', idsToUpdate);

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

    // ⚡ 樂觀更新 (Optimistic UI)：立即從前端列表中移除該訂單
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

    // ⚡ 樂觀更新 (Optimistic UI)：立即從前端列表中移除選取的訂單
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

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between pb-12 transition-colors duration-200">
        <Header />
        <main className="max-w-md mx-auto w-full px-4 py-8">
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 text-3xl mx-auto flex items-center justify-center font-bold border border-sky-100 dark:border-sky-900/60">
              👑
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">「咩nu」團長管理後台</h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">請輸入團長密碼解鎖權限</p>
            </div>

            {lockoutRemaining > 0 ? (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 text-center space-y-1">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300">🔒 密碼錯誤次數過多</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">系統防撞庫鎖定中，請於 <span className="font-bold font-mono">{lockoutRemaining}</span> 秒後再試</p>
              </div>
            ) : (
              <form onSubmit={handleUnlock} className="space-y-3 pt-2">
                <label htmlFor="admin-passcode-input" className="sr-only">團長後台解鎖密碼</label>
                <input
                  id="admin-passcode-input"
                  name="adminPasscode"
                  type="password"
                  aria-label="團長後台密碼"
                  placeholder="輸入密碼 (預設：8888)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  disabled={isVerifying}
                  className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
                />

                {/* 🛡️ 撞庫防護：連續錯誤 2 次以上啟動動態人機挑戰 */}
                {failedAttempts >= 2 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3 text-left space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <span>🤖 人機驗證安全挑戰：</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCaptchaChallenge(generateMathChallenge());
                          setCaptchaInput('');
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 underline text-[10px] cursor-pointer"
                      >
                        🔄 換一題
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 font-mono font-extrabold text-amber-900 dark:text-amber-300 text-sm tracking-wider shadow-xs">
                        {captchaChallenge.question}
                      </span>
                      <label htmlFor="admin-captcha-input" className="sr-only">人機驗證答案</label>
                      <input
                        id="admin-captcha-input"
                        name="captchaAnswer"
                        type="number"
                        aria-label="人機驗證答案"
                        placeholder="請填答案"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        disabled={isVerifying}
                        className="flex-1 bg-white dark:bg-[#182234] border border-amber-200 dark:border-amber-900/60 rounded-xl py-1.5 px-3 text-center text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-3 rounded-2xl text-sm transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      安全校驗中...
                    </>
                  ) : (
                    '解鎖進入後台 ➔'
                  )}
                </button>
              </form>
            )}
          </div>
        </main>
        <div />
      </div>
    );
  }

  const isDesktop = viewMode === 'desktop';

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-200 ${isDesktop ? 'bg-slate-100/70 dark:bg-[#0B0F17]' : 'bg-slate-200/60 dark:bg-[#06090E]'}`}>
      <OfflineBanner />
      <Header />

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* 根據視圖模式套用容器寬度：Desktop (max-w-7xl) vs Mobile (max-w-md 居中手機外框) */}
      <main
        className={`mx-auto pt-4 space-y-4 transition-all duration-300 ${
          isDesktop
            ? 'max-w-7xl px-4 sm:px-6 lg:px-8'
            : 'max-w-md px-4 min-h-screen bg-slate-50 dark:bg-[#0B0F17] border-x border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl my-2'
        }`}
      >
        {/* 頂部操作與模式切換 Bar */}
        <div className="bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition py-1"
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
                title={isSoundEnabled ? '新訂單音效提醒：已開啟（點擊靜音）' : '新訂單音效提醒：已靜音（點擊開啟）'}
              >
                <span>{isSoundEnabled ? '🔔 叮咚提醒: 開' : '🔕 叮咚提醒: 關'}</span>
              </button>

              {isSoundEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    initAudio();
                    lastNotificationTimeRef.current = 0;
                    playChimeSound();
                    showToast('🔔 正在試聽新訂單提示音效...');
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition cursor-pointer"
                  title="點擊測試播放新訂單叮咚鈴聲"
                >
                  🔊 試聽
                </button>
              )}
            </div>

            {/* 螢幕模式切換器 (手機比例 / 電腦比例) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold border border-transparent dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleToggleViewMode('desktop')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="切換為電腦寬螢幕多欄排版"
              >
                <span>💻</span>
                <span>電腦比例</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('mobile')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="切換為手機單手聚焦排版"
              >
                <span>📱</span>
                <span>手機比例</span>
              </button>
            </div>

            {/* 🌓 主題模式切換器 (位於手機比例/電腦比例同欄相鄰位置) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title={theme === 'dark' ? '切換為亮色主題' : '切換為暗色主題'}
            >
              <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span>{theme === 'dark' ? '暗色主題' : '亮色主題'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold px-3 py-1.5 rounded-xl border border-transparent dark:border-slate-700 transition cursor-pointer"
            >
              🔒 上鎖登出
            </button>
          </div>
        </div>

        {/* 核心分頁 Tab 切換 */}
        <div className={`flex bg-white dark:bg-[#131B2B] p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs text-xs font-bold text-slate-600 dark:text-slate-300 ${isDesktop ? 'max-w-md' : 'w-full'}`}>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'active'
                ? 'bg-sky-500 text-white shadow-xs font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            即時對帳
          </button>
          <button
            onClick={() => setActiveTab('crud')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'crud'
                ? 'bg-sky-500 text-white shadow-xs font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            菜單/店家CRUD
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-2 rounded-xl transition ${
              activeTab === 'archive'
                ? 'bg-sky-500 text-white shadow-xs font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
          >
            歷史歸檔 ({archivedGroups.length})
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-10 text-center text-slate-400 dark:text-slate-500 text-xs animate-pulse border border-slate-100 dark:border-slate-800">
            正在載入後台數據與團購活動資料...
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
                menuItems={crudMenuItems}
                paymentMethods={paymentMethods}
                soldOutOptions={soldOutOptions}
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
                onCreateMenuItem={() => handleOpenItemModal()}
                onEditMenuItem={(item: MenuItem) => handleOpenItemModal(item)}
                onOpenBatchImportModal={() => setIsBatchImportModalOpen(true)}
                onDeleteMenuItem={handleDeleteProduct}
                onToggleMenuItemActive={(id: string) => {
                  const item = crudMenuItems.find((m) => m.id === id);
                  if (item) handleToggleProductStatus(item);
                }}
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
              />
            )}
          </>
        )}
      </main>

      {/* 友善列印檢視 Modal */}
      <AdminPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        groupOrder={activeGroup}
        submissions={submissions}
        itemSummary={itemSummary}
        grandTotal={grandTotal}
      />

      {/* 團長代點餐 Modal */}
      <AdminManualOrderModal
        isOpen={isManualOrderModalOpen}
        onClose={() => setIsManualOrderModalOpen(false)}
        groupOrder={activeGroup}
        menuItems={crudMenuItems}
        paymentMethods={paymentMethods}
        soldOutOptions={soldOutOptions}
        onOrderAdded={fetchAdminData}
      />

      {/* 菜單 CSV 批量匯入 Modal */}
      <AdminBatchImportModal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        storeId={selectedCrudStoreId}
        storeName={stores.find((s) => s.id === selectedCrudStoreId)?.name || '當前店家'}
        onImportSuccess={fetchAdminData}
      />

      {/* 團購活動與公告進階設定 Modal */}
      <AdminGroupSettingsModal
        isOpen={isGroupSettingsModalOpen}
        onClose={() => setIsGroupSettingsModalOpen(false)}
        groupOrder={activeGroup}
        stores={stores}
        onSaveGroupSettings={handleSaveGroupSettings}
      />

      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2B] w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
              {editingStore ? '✏️ 編輯店家資訊' : '🏪 新增合作店家'}
            </h3>

            <form onSubmit={handleSaveStore} className="space-y-3">
              <div>
                <label htmlFor="store-form-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">店家名稱</label>
                <input
                  id="store-form-name"
                  name="storeName"
                  type="text"
                  required
                  placeholder="例如：50嵐"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="store-form-image" className="text-xs font-bold text-slate-600 dark:text-slate-300">店家封面照片</label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">💡 建議像素：800 x 600 px (自動轉 WebP)</span>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  {storeImagePreview ? (
                    <img src={storeImagePreview} alt="預覽" className="w-14 h-14 rounded-lg object-cover border border-slate-300 dark:border-slate-600" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-400 dark:text-slate-300 font-bold">無照片</div>
                  )}

                  <div className="flex-1">
                    <input
                      id="store-form-image"
                      name="storeImage"
                      type="file"
                      aria-label="上傳店家封面照片"
                      accept="image/*"
                      onChange={handleStoreImageChange}
                      className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sky-50 dark:file:bg-slate-800 file:text-sky-600 dark:file:text-sky-400 hover:file:bg-sky-100 dark:hover:file:bg-slate-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">前端自動壓縮為輕量 WebP 格式</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs disabled:opacity-50 transition"
                >
                  {uploadingImage ? '上傳中...' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2B] w-full max-w-sm rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
              {editingCat ? '✏️ 編輯類別名稱' : '🏷️ 新增類別'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label htmlFor="cat-form-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">類別名稱</label>
                <input
                  id="cat-form-name"
                  name="categoryName"
                  type="text"
                  required
                  placeholder="例如：手搖飲料"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2B] w-full max-w-lg rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-center text-slate-800 dark:text-slate-100">
              {editingProduct ? '✏️ 編輯餐點與客製化選項' : '➕ 新增餐點'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label htmlFor="prod-form-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">餐點名稱 *</label>
                <input
                  id="prod-form-name"
                  name="productName"
                  type="text"
                  required
                  placeholder="例如：珍珠奶茶"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prod-form-price" className="text-xs font-bold text-slate-600 dark:text-slate-300">基本價格 ($) *</label>
                  <input
                    id="prod-form-price"
                    name="productPrice"
                    type="number"
                    required
                    min="0"
                    placeholder="例如：50"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label htmlFor="prod-form-soldout" className="text-xs font-bold text-slate-600 dark:text-slate-300">是否售完/停售</label>
                  <select
                    id="prod-form-soldout"
                    name="productIsSoldOut"
                    value={productForm.is_sold_out ? 'true' : 'false'}
                    onChange={(e) => setProductForm({ ...productForm, is_sold_out: e.target.value === 'true' })}
                    className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl py-2 px-3 text-xs font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="false">🟢 正常供應中</option>
                    <option value="true">⚪ 暫時已售完 / 下架</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="prod-form-desc" className="text-xs font-bold text-slate-600 dark:text-slate-300">餐點簡介描述 (選填)</label>
                <textarea
                  id="prod-form-desc"
                  name="productDescription"
                  rows={2}
                  placeholder="簡短介紹這道餐點的特色或美味之處..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-xs font-medium mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              {/* 客製化規格選項管理 */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">客製化規格選項 (例如：甜度、冰塊、加料)</span>
                  <button
                    type="button"
                    onClick={handleAddCustomGroup}
                    className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-sky-100 dark:border-slate-700 transition active:scale-95"
                  >
                    ＋ 新增規格組
                  </button>
                </div>

                {productCustomGroups.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-[#182234] p-4 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                    此餐點為基本款（無客製化規格選項）
                  </div>
                ) : (
                  productCustomGroups.map((group) => (
                    <div key={group.id} className="bg-slate-50 dark:bg-[#182234] p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex gap-2 items-center">
                        <input
                          id={`group-title-${group.id}`}
                          name={`group_title_${group.id}`}
                          aria-label="規格組名稱"
                          type="text"
                          required
                          placeholder="規格組名稱 (例：甜度)"
                          value={group.title}
                          onChange={(e) =>
                            setProductCustomGroups(
                              productCustomGroups.map((g) => (g.id === group.id ? { ...g, title: e.target.value } : g))
                            )
                          }
                          className="flex-1 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-bold"
                        />
                        <select
                          id={`group-type-${group.id}`}
                          name={`group_type_${group.id}`}
                          aria-label="規格選擇類型"
                          value={group.type}
                          onChange={(e) =>
                            setProductCustomGroups(
                              productCustomGroups.map((g) =>
                                g.id === group.id ? { ...g, type: e.target.value as 'single' | 'limit' | 'any' } : g
                              )
                            )
                          }
                          className="bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-bold"
                        >
                          <option value="single">單選 (必選 1)</option>
                          <option value="limit">限量選 (最多 N)</option>
                          <option value="any">自由選 (多選)</option>
                        </select>

                        {group.type === 'limit' && (
                          <input
                            id={`group-limit-${group.id}`}
                            name={`group_limit_${group.id}`}
                            aria-label="最多可選數量"
                            type="number"
                            min="1"
                            placeholder="上限"
                            value={group.limit_number || 1}
                            onChange={(e) =>
                              setProductCustomGroups(
                                productCustomGroups.map((g) =>
                                  g.id === group.id ? { ...g, limit_number: Number(e.target.value) } : g
                                )
                              )
                            }
                            className="w-14 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-2 rounded-xl text-xs font-bold text-center"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveCustomGroup(group.id)}
                          className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg font-bold"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="space-y-2 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                        {group.options.map((opt) => (
                          <div key={opt.id} className="flex gap-2 items-center">
                            <input
                              id={`opt-name-${opt.id}`}
                              name={`opt_name_${opt.id}`}
                              aria-label="選項名稱"
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
                              className="flex-1 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-1.5 rounded-lg text-xs font-bold"
                            />
                            <input
                              id={`opt-price-${opt.id}`}
                              name={`opt_price_${opt.id}`}
                              aria-label="加價金額"
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
                              className="w-20 bg-white dark:bg-[#131B2B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-1.5 rounded-lg text-xs font-bold"
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
                          className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline"
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
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition"
                >
                  儲存餐點
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {signatureTarget && (
        <SignatureModal
          nickname={signatureTarget.user_nickname}
          onClose={() => setSignatureTarget(null)}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {changeModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131B2B] w-full max-w-xs rounded-3xl p-5 space-y-4 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-center shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">💵 現金找零試算器</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {changeModalTarget.nickname} 應付金額：
              <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm">${changeModalTarget.amount} 元</span>
            </p>

            <label htmlFor="change-received-cash" className="sr-only">實收現金金額</label>
            <input
              id="change-received-cash"
              name="receivedCash"
              type="number"
              aria-label="實收現金金額"
              placeholder="例如：1000"
              value={receivedCash}
              onChange={(e) => setReceivedCash(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl py-2 px-3 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
            />

            {Number(receivedCash) > 0 && (
              <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-2xl border border-sky-100 dark:border-sky-900/60">
                <p className="text-xs text-sky-700 dark:text-sky-300 font-bold">💰 應找零金額</p>
                <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
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
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-xs transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}