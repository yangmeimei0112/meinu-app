'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { Store, MenuItem, Category } from '@/types/database';
import { AdminArchiveSection } from './AdminArchiveSection';
import { AdminCrudSection } from './AdminCrudSection';
import { AdminDashboardSection } from './AdminDashboardSection';
import { AdminViewMode, AdminTabType, AdminConfirmModalState } from './admin-types';
import { useTheme } from '@/lib/theme';
import { useAdminSound } from './hooks/useAdminSound';
import { useAdminData } from './hooks/useAdminData';
import { useAdminStoreCrud } from './hooks/useAdminStoreCrud';
import { useAdminOrderActions } from './hooks/useAdminOrderActions';

// 子元件與彈窗
import AdminAuthLock from './components/AdminAuthLock';
import AdminStoreModal from './components/AdminStoreModal';
import AdminCategoryModal from './components/AdminCategoryModal';
import AdminProductModal from './components/AdminProductModal';
import AdminChangeModal from './components/AdminChangeModal';
import { AdminMaintenanceSection } from './components/AdminMaintenanceSection';

// 🚀 隨選動態加載重型彈窗 (Code Splitting)
const AdminPrintModal = dynamic(() => import('./AdminPrintModal'), { ssr: false });
const AdminManualOrderModal = dynamic(() => import('./AdminManualOrderModal'), { ssr: false });
const AdminBatchImportModal = dynamic(() => import('./AdminBatchImportModal'), { ssr: false });
const AdminGroupSettingsModal = dynamic(() => import('./AdminGroupSettingsModal'), { ssr: false });
const SignatureModal = dynamic(() => import('@/components/SignatureModal'), { ssr: false });
const DoubleConfirmModal = dynamic(() => import('@/components/DoubleConfirmModal'), { ssr: false });

export default function AdminPageContent() {
  const { theme, toggleTheme } = useTheme();
  const { isSoundEnabled, playChimeSound, initAudio, toggleSound } = useAdminSound();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTabType>('active');
  const [viewMode, setViewMode] = useState<AdminViewMode>('desktop');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const [adminConfirmModal, setAdminConfirmModal] = useState<AdminConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '確定',
    cancelText: '取消',
    isDanger: false,
    onConfirm: () => {},
  });

  const openAdminConfirmModal = useCallback((modal: AdminConfirmModalState) => {
    setAdminConfirmModal({
      ...modal,
      confirmText: modal.confirmText || '確定',
      cancelText: modal.cancelText || '取消',
      isDanger: modal.isDanger ?? false,
    });
  }, []);

  const closeAdminConfirmModal = useCallback(() => {
    setAdminConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 1. 後台核心資料與 Realtime Hook
  const {
    activeGroup,
    setActiveGroup,
    activeGroups,
    setActiveGroups,
    selectedActiveGroupId,
    setSelectedActiveGroupId,
    selectedActiveGroupIdRef,
    archivedGroups,
    stores,
    setStores,
    categories,
    setCategories,
    paymentMethods,
    setPaymentMethods,
    soldOutOptions,
    setSoldOutOptions,
    allMenuItems,
    setAllMenuItems,
    allSubmissions,
    setAllSubmissions,
    submissions,
    loading,
    fetchAdminData,
    inputDeliveryFee,
    setInputDeliveryFee,
    inputDiscount,
    setInputDiscount,
    roundingRule,
    setRoundingRule,
  } = useAdminData({
    isUnlocked,
    playChimeSound,
    showToast,
  });

  // 計算餐點彙總與全團金額
  const itemSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    submissions.forEach((sub) => {
      sub.order_items?.forEach((item) => {
        summary[item.item_name] = (summary[item.item_name] || 0) + item.quantity;
      });
    });
    return summary;
  }, [submissions]);

  const grandTotal = useMemo(() => {
    return submissions.reduce((sum, sub) => sum + sub.final_amount, 0);
  }, [submissions]);

  const paidTotal = useMemo(() => {
    return submissions.filter((s) => s.is_paid).reduce((sum, s) => sum + s.final_amount, 0);
  }, [submissions]);

  // 2. 店家、分類、餐點品項 CRUD 操作 Hook
  const {
    isStoreModalOpen,
    setIsStoreModalOpen,
    editingStore,
    setEditingStore,
    storeForm,
    setStoreForm,
    storeImageFile,
    setStoreImageFile,
    storeImagePreview,
    setStoreImagePreview,
    uploadingImage,
    handleStoreImageChange,
    handleSaveStore,
    handleDeleteStore,
    isCatModalOpen,
    setIsCatModalOpen,
    editingCat,
    setEditingCat,
    catNameInput,
    setCatNameInput,
    handleSaveCategory,
    handleDeleteCategory,
    handleMoveCategory,
    handleCreatePaymentMethod,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handleTogglePaymentMethodActive,
    handleCreateSoldOutOption,
    handleSaveSoldOutOption,
    handleDeleteSoldOutOption,
    handleMoveSoldOutOption,
    selectedCrudStoreId,
    setSelectedCrudStoreId,
    isProductModalOpen,
    setIsProductModalOpen,
    editingProduct,
    setEditingProduct,
    productForm,
    setProductForm,
    productCustomGroups,
    setProductCustomGroups,
    handleAddCustomGroup,
    handleRemoveCustomGroup,
    handleAddOptionToGroup,
    handleRemoveOptionFromGroup,
    handleSaveProduct,
    handleDeleteProduct,
    handleToggleProductStatus,
  } = useAdminStoreCrud({
    categories,
    paymentMethods,
    soldOutOptions,
    allMenuItems,
    fetchAdminData,
    showToast,
    openAdminConfirmModal,
    closeAdminConfirmModal,
  });

  // 3. 訂單對帳、平攤、簽名與匯出 Hook
  const {
    isPrintModalOpen,
    setIsPrintModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isBatchImportModalOpen,
    setIsBatchImportModalOpen,
    isGroupSettingsModalOpen,
    setIsGroupSettingsModalOpen,
    signatureTarget,
    setSignatureTarget,
    changeModalTarget,
    setChangeModalTarget,
    receivedCash,
    setReceivedCash,
    selectedSubmissionIds,
    setSelectedSubmissionIds,
    selectedArchivedGroupId,
    setSelectedArchivedGroupId,
    calculateAdjustedAmount,
    handleApplyFeeSplit,
    handleSaveSignature,
    handleArchiveGroup,
    handleReopenGroup,
    handleDeleteArchivedGroup,
    handleBatchDeleteArchivedGroups,
    handleSaveGroupSettings,
    handleToggleGroupStatus,
    handleTogglePaid,
    handleBatchMarkPaid,
    handleDeleteOrder,
    handleBatchDeleteOrders,
    handleCopyPersonalReceipt,
    handleCopyStoreOrderText,
    handleCopyUnpaidReminder,
    handleExportOrdersCSV,
  } = useAdminOrderActions({
    activeGroup,
    setActiveGroup,
    submissions,
    allSubmissions,
    setAllSubmissions,
    itemSummary,
    grandTotal,
    inputDeliveryFee,
    inputDiscount,
    roundingRule,
    selectedActiveGroupIdRef,
    fetchAdminData,
    showToast,
    openAdminConfirmModal,
    closeAdminConfirmModal,
    setActiveTab,
  });

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

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsUnlocked(false);
    showToast('🔒 已安全登出團長後台');
  };

  const handleOpenStoreModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({ name: store.name, category_id: store.category_id || '' });
      setStoreImagePreview(store.image_url || '');
    } else {
      setEditingStore(null);
      setStoreForm({ name: '', category_id: '' });
      setStoreImagePreview('');
    }
    setStoreImageFile(null);
    setIsStoreModalOpen(true);
  };

  const handleOpenItemModal = (item?: MenuItem, storeId?: string) => {
    if (item) {
      setEditingProduct(item);
      setProductForm({
        name: item.name,
        price: item.price.toString(),
        description: item.description || '',
        stock_quantity: item.stock_quantity ? item.stock_quantity.toString() : '',
        is_sold_out: item.is_sold_out || false,
      });
      setProductCustomGroups(item.custom_groups || []);
      setSelectedCrudStoreId(item.store_id);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        description: '',
        stock_quantity: '',
        is_sold_out: false,
      });
      setProductCustomGroups([]);
      if (storeId) setSelectedCrudStoreId(storeId);
    }
    setIsProductModalOpen(true);
  };

  const isDesktop = viewMode === 'desktop';

  // 🔒 若尚未解鎖後台密碼，渲染安全驗證卡片
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080D1A] flex flex-col justify-between">
        <Header />
        <OfflineBanner />
        <AdminAuthLock onUnlockSuccess={() => setIsUnlocked(true)} onInitAudio={initAudio} />
        <div className="p-4 text-center text-xs text-slate-400">
          咩nu 團購點餐平台 &bull; 團長專用安全後台
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={initAudio}
      className="min-h-screen bg-slate-50 dark:bg-[#080D1A] text-slate-800 dark:text-slate-100 flex flex-col pb-20 select-none transition-colors duration-200"
    >
      <Header />
      <OfflineBanner />

      {/* 浮動提示 Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* 團長控制台頂部功能列 (Frosted Glassmorphism Header) */}
      <div className="bg-white/85 dark:bg-[#070B14]/85 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/80 sticky top-0 z-40 px-4 py-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* 左側標題 */}
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>團長主控台</span>
            </h1>
            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              即時連線中
            </span>
          </div>

          {/* 右側工具操作區 (音效切換、版面切換、主題切換、登出) - 膠囊群組化排版 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 新訂單叮咚提醒開關 */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-2xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isSoundEnabled
                  ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800/70 shadow-sky-500/10'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title={isSoundEnabled ? '已開啟新訂單叮咚音效 (點擊關閉)' : '已靜音新訂單提示音 (點擊開啟)'}
            >
              <span>{isSoundEnabled ? '🔔' : '🔕'}</span>
              <span className="hidden sm:inline font-black">{isSoundEnabled ? '音效開啟' : '靜音中'}</span>
            </button>

            {/* 版面檢視切換 (電腦版雙欄 / 手機版單欄) */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleViewMode('desktop')}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="寬螢幕雙欄檢視 (推薦電腦使用)"
              >
                💻
              </button>
              <button
                type="button"
                onClick={() => handleToggleViewMode('mobile')}
                className={`px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="單欄緊湊檢視 (推薦手機使用)"
              >
                📱
              </button>
            </div>

            {/* 深淺色主題切換 */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-2xl font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* 前台大廳入口 */}
            <Link
              href="/"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-2xl font-black text-xs transition active:scale-95 shadow-2xs"
            >
              🏪 前台大廳
            </Link>

            {/* 安全登出 */}
            <button
              type="button"
              onClick={handleLogout}
              className="bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 px-3.5 py-2 rounded-2xl font-black text-xs transition active:scale-95 cursor-pointer shadow-2xs"
            >
              🔒 登出
            </button>
          </div>
        </div>
      </div>

      {/* 分頁 Tab 導覽切換 (即時對帳 / 店家菜單 / 歷史歸檔 / 系統維護) */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-[#0E1726]/90 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-800 overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 min-w-[105px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📊 即時對帳</span>
            {submissions.length > 0 && (
              <span className="bg-sky-500 dark:bg-white text-white dark:text-sky-800 text-[10px] px-2 py-0.2 rounded-full font-black">
                {submissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crud')}
            className={`flex-1 min-w-[115px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'crud'
                ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>🏪 店家菜單設計</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`flex-1 min-w-[95px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-sky-500 text-sky-700 dark:text-white shadow-md shadow-sky-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📦 歷史歸檔</span>
            {archivedGroups.length > 0 && (
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] px-2 py-0.2 rounded-full font-bold">
                {archivedGroups.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 min-w-[115px] py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'maintenance'
                ? 'bg-white dark:bg-amber-500 text-amber-700 dark:text-white shadow-md shadow-amber-500/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>🚧 系統更新控制</span>
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

            {activeTab === 'maintenance' && (
              <AdminMaintenanceSection showToast={showToast} />
            )}
          </>
        )}
      </main>

      {/* 友善列印檢視 Modal */}
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

      {/* 團長代點餐 Modal */}
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

      {/* 菜單 CSV 批量匯入 Modal */}
      {isBatchImportModalOpen && (
        <AdminBatchImportModal
          isOpen={isBatchImportModalOpen}
          onClose={() => setIsBatchImportModalOpen(false)}
          storeId={selectedCrudStoreId}
          storeName={stores.find((s) => s.id === selectedCrudStoreId)?.name || '當前店家'}
          onImportSuccess={fetchAdminData}
        />
      )}

      {/* 團購活動與公告進階設定 Modal */}
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

      {/* 簽名預覽 Modal */}
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

      {/* ⚠️ 全域後台操作二次確認彈窗 */}
      <DoubleConfirmModal
        isOpen={adminConfirmModal.isOpen}
        title={adminConfirmModal.title}
        message={adminConfirmModal.message}
        confirmText={adminConfirmModal.confirmText}
        cancelText={adminConfirmModal.cancelText}
        isDanger={adminConfirmModal.isDanger}
        onConfirm={adminConfirmModal.onConfirm}
        onCancel={closeAdminConfirmModal}
      />
    </div>
  );
}