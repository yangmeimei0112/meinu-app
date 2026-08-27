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
import { useAdminSpeech } from './hooks/useAdminSpeech';
import { useAdminData } from './hooks/useAdminData';
import { useAdminStoreCrud } from './hooks/useAdminStoreCrud';
import { useAdminOrderActions } from './hooks/useAdminOrderActions';

// 子元件與彈窗
import AdminAuthLock from './components/AdminAuthLock';
import AdminTopBar from './components/AdminTopBar';
import AdminTabsNav from './components/AdminTabsNav';
import AdminVoiceSettingsModal from './components/AdminVoiceSettingsModal';
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
  const {
    isSpeechEnabled,
    speechMode,
    speechRate,
    isSpeaking,
    speakOrder,
    playTestSpeech,
    toggleSpeech,
    setSpeechMode,
    setSpeechRate,
  } = useAdminSpeech();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTabType>('active');
  const [viewMode, setViewMode] = useState<AdminViewMode>('desktop');
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState<boolean>(false);

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

  // 1. 後台核心資料與 Realtime Hook (傳入音效與語音獨立分流狀態)
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
    optimisticReorderMenuItems,
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
    isSoundEnabled,
    speakOrder,
    isSpeechEnabled,
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
    handleReorderMenuItems,
  } = useAdminStoreCrud({
    stores,
    categories,
    paymentMethods,
    soldOutOptions,
    allMenuItems,
    optimisticReorderMenuItems,
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
    showToast(next ? '已開啟新訂單叮咚提醒（試聽播放）' : '已靜音新訂單提示音效');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsUnlocked(false);
    showToast('已安全登出團長後台');
  };

  const handleOpenStoreModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      const currentCodeNumber = store.code ? store.code.replace(/\D/g, '') : '001';
      setStoreForm({
        name: store.name,
        category_id: store.category_id || '',
        code_number: currentCodeNumber,
      });
      setStoreImagePreview(store.image_url || '');
    } else {
      setEditingStore(null);
      // 智慧推薦最小可用正整數 (Min Available Gap)
      const usedNumbers = new Set<number>();
      stores.forEach((s) => {
        if (s.code) {
          const num = parseInt(s.code.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 0) usedNumbers.add(num);
        }
      });
      let minAvail = 1;
      while (usedNumbers.has(minAvail)) minAvail++;
      setStoreForm({
        name: '',
        category_id: '',
        code_number: String(minAvail).padStart(3, '0'),
      });
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
    return <AdminAuthLock onUnlockSuccess={() => setIsUnlocked(true)} onInitAudio={initAudio} />;
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
      <AdminTopBar
        isSoundEnabled={isSoundEnabled}
        handleToggleSound={handleToggleSound}
        isSpeechEnabled={isSpeechEnabled}
        isSpeaking={isSpeaking}
        toggleSpeech={toggleSpeech}
        onOpenVoiceSettings={() => setShowVoiceSettingsModal(true)}
        viewMode={viewMode}
        handleToggleViewMode={handleToggleViewMode}
        theme={theme}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        showToast={showToast}
      />

      {/* 分頁 Tab 導覽切換 (即時對帳 / 店家菜單 / 歷史歸檔 / 系統維護) */}
      <AdminTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSubmissionsCount={submissions.length}
      />

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
                onReorderMenuItems={handleReorderMenuItems}
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
        stores={stores}
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

      {/* 🗣️ 新訂單語音詳細播報設定與試聽 Modal */}
      <AdminVoiceSettingsModal
        isOpen={showVoiceSettingsModal}
        onClose={() => setShowVoiceSettingsModal(false)}
        isSpeechEnabled={isSpeechEnabled}
        toggleSpeech={toggleSpeech}
        speechMode={speechMode}
        setSpeechMode={setSpeechMode}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        playTestSpeech={playTestSpeech}
      />
    </div>
  );
}