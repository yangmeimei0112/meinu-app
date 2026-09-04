'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import { Store, MenuItem } from '@/types/database';
import { AdminArchiveSection } from './AdminArchiveSection';
import { AdminCrudSection } from './AdminCrudSection';
import { AdminDashboardSection } from './AdminDashboardSection';
import { AdminViewMode, AdminTabType } from './admin-types';
import { useTheme } from '@/lib/theme';
import { useAdminSound } from './hooks/useAdminSound';
import { useAdminSpeech } from './hooks/useAdminSpeech';
import { useAdminData } from './hooks/useAdminData';
import { useAdminStoreCrud } from './hooks/useAdminStoreCrud';
import { useAdminOrderActions } from './hooks/useAdminOrderActions';
import { useAdminModalState } from './hooks/useAdminModalState';
import { useAdminGlobalSettingsCrud } from './hooks/useAdminGlobalSettingsCrud';

// 子元件與彈窗
import AdminAuthLock from './components/AdminAuthLock';
import AdminTopBar from './components/AdminTopBar';
import AdminTabsNav from './components/AdminTabsNav';
import { AdminMaintenanceSection } from './components/AdminMaintenanceSection';
import { AdminModalsContainer } from './components/modals/AdminModalsContainer';

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

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // 1. Modal 狀態管理 Hook
  const {
    isPrintModalOpen,
    setIsPrintModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isBatchImportModalOpen,
    setIsBatchImportModalOpen,
    isGroupSettingsModalOpen,
    setIsGroupSettingsModalOpen,
    showVoiceSettingsModal,
    setShowVoiceSettingsModal,
    signatureTarget,
    setSignatureTarget,
    changeModalTarget,
    setChangeModalTarget,
    receivedCash,
    setReceivedCash,
    adminConfirmModal,
    openAdminConfirmModal,
    closeAdminConfirmModal,
  } = useAdminModalState();

  // 2. 後台核心資料與 Realtime Hook
  const {
    activeGroup,
    setActiveGroup,
    activeGroups,
    selectedActiveGroupId,
    setSelectedActiveGroupId,
    selectedActiveGroupIdRef,
    archivedGroups,
    stores,
    categories,
    setCategories,
    paymentMethods,
    setPaymentMethods,
    soldOutOptions,
    setSoldOutOptions,
    allMenuItems,
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

  // 3. 店家、分類、餐點品項 CRUD 操作 Hook
  const {
    isStoreModalOpen,
    setIsStoreModalOpen,
    editingStore,
    storeForm,
    setStoreForm,
    storeImagePreview,
    uploadingImage,
    handleStoreImageChange,
    handleSaveStore,
    handleDeleteStore,
    openCreateStoreModal,
    openEditStoreModal,
    isCatModalOpen,
    setIsCatModalOpen,
    editingCat,
    catNameInput,
    setCatNameInput,
    openCreateCategoryModal,
    handleSaveCategory,
    handleDeleteCategory,
    selectedCrudStoreId,
    setSelectedCrudStoreId,
    isProductModalOpen,
    setIsProductModalOpen,
    editingProduct,
    productForm,
    setProductForm,
    productCustomGroups,
    setProductCustomGroups,
    openCreateProductModal,
    openEditProductModal,
    handleAddCustomGroup,
    handleRemoveCustomGroup,
    handleAddOptionToGroup,
    handleRemoveOptionFromGroup,
    handleSaveProduct,
    handleDeleteProduct,
    handleToggleProductSoldOut,
    handleReorderProducts,
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

  // 4. 全域設定（付款方式、缺貨備案、分類順序）Hook
  const {
    handleMoveCategory,
    handleCreatePaymentMethod,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handleTogglePaymentMethodActive,
    onCreateSoldOutOption,
    onSaveSoldOutOption,
    onDeleteSoldOutOption,
    onMoveSoldOutOption,
  } = useAdminGlobalSettingsCrud({
    categories,
    paymentMethods,
    soldOutOptions,
    fetchAdminData,
    showToast,
    openAdminConfirmModal,
    closeAdminConfirmModal,
  });

  // 5. 訂單對帳、平攤、簽名與匯出 Hook
  const {
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
    handleUpdateProgressStatus,
    handleBatchUpdateProgressStatus,
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
    signatureTarget,
    setSignatureTarget,
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

  const isDesktop = viewMode === 'desktop';

  // 🔒 若尚未解鎖後台密碼，渲染安全驗證卡片
  if (!isUnlocked) {
    return <AdminAuthLock onUnlockSuccess={() => setIsUnlocked(true)} onInitAudio={initAudio} />;
  }

  return (
    <div
      onClick={initAudio}
      className="min-h-[100dvh] bg-slate-50 dark:bg-[#080D1A] text-slate-800 dark:text-slate-100 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] select-none transition-colors duration-200"
    >
      <Header />
      <OfflineBanner />

      {/* 浮動提示 Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* 團長控制台頂部功能列 */}
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

      {/* 分頁 Tab 導覽切換 */}
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
                handleUpdateProgressStatus={handleUpdateProgressStatus}
                handleBatchUpdateProgressStatus={handleBatchUpdateProgressStatus}
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
                onCreateStore={openCreateStoreModal}
                onEditStore={(store: Store) => openEditStoreModal(store)}
                onDeleteStore={(id: string) => {
                  const store = stores.find((s) => s.id === id);
                  if (store) handleDeleteStore(id, store.name);
                }}
                onCreateCategory={openCreateCategoryModal}
                onMoveCategory={(id: string, direction: 'up' | 'down') => {
                  const category = categories.find((c) => c.id === id);
                  if (category) handleMoveCategory(category, direction);
                }}
                onDeleteCategory={(id: string) => {
                  const category = categories.find((c) => c.id === id);
                  if (category) handleDeleteCategory(id, category.name);
                }}
                onCreateMenuItem={(storeId) => openCreateProductModal(storeId || (stores[0]?.id ?? ''))}
                onEditMenuItem={(item: MenuItem) => openEditProductModal(item)}
                onOpenBatchImportModal={(storeId) => {
                  if (storeId) setSelectedCrudStoreId(storeId);
                  setIsBatchImportModalOpen(true);
                }}
                onDeleteMenuItem={(id: string) => {
                  const product = allMenuItems.find((p) => p.id === id);
                  if (product) handleDeleteProduct(id, product.name);
                }}
                onToggleMenuItemActive={(id: string) => {
                  const product = allMenuItems.find((p) => p.id === id);
                  if (product) handleToggleProductSoldOut(id, product.is_sold_out);
                }}
                onReorderMenuItems={handleReorderProducts}
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
                onCreateSoldOutOption={onCreateSoldOutOption}
                onDeleteSoldOutOption={onDeleteSoldOutOption}
                onMoveSoldOutOption={onMoveSoldOutOption}
                onUpdateSoldOutOption={(id: string, title: string) => {
                  setSoldOutOptions((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)));
                }}
                onSaveSoldOutOption={onSaveSoldOutOption}
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

      {/* 🌟 集中化掛載後台所有彈窗 */}
      <AdminModalsContainer
        isPrintModalOpen={isPrintModalOpen}
        setIsPrintModalOpen={setIsPrintModalOpen}
        activeGroup={activeGroup}
        submissions={submissions}
        itemSummary={itemSummary}
        grandTotal={grandTotal}
        isManualOrderModalOpen={isManualOrderModalOpen}
        setIsManualOrderModalOpen={setIsManualOrderModalOpen}
        allMenuItems={allMenuItems}
        paymentMethods={paymentMethods}
        soldOutOptions={soldOutOptions}
        fetchAdminData={fetchAdminData}
        isBatchImportModalOpen={isBatchImportModalOpen}
        setIsBatchImportModalOpen={setIsBatchImportModalOpen}
        selectedCrudStoreId={selectedCrudStoreId}
        stores={stores}
        isGroupSettingsModalOpen={isGroupSettingsModalOpen}
        setIsGroupSettingsModalOpen={setIsGroupSettingsModalOpen}
        handleSaveGroupSettings={handleSaveGroupSettings}
        isStoreModalOpen={isStoreModalOpen}
        setIsStoreModalOpen={setIsStoreModalOpen}
        editingStore={editingStore}
        categories={categories}
        storeForm={storeForm}
        setStoreForm={setStoreForm}
        storeImagePreview={storeImagePreview}
        uploadingImage={uploadingImage}
        handleSaveStore={handleSaveStore}
        handleStoreImageChange={handleStoreImageChange}
        isCatModalOpen={isCatModalOpen}
        setIsCatModalOpen={setIsCatModalOpen}
        editingCat={editingCat}
        catNameInput={catNameInput}
        setCatNameInput={setCatNameInput}
        handleSaveCategory={handleSaveCategory}
        isProductModalOpen={isProductModalOpen}
        setIsProductModalOpen={setIsProductModalOpen}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        productCustomGroups={productCustomGroups}
        setProductCustomGroups={setProductCustomGroups}
        handleSaveProduct={handleSaveProduct}
        handleAddCustomGroup={handleAddCustomGroup}
        handleRemoveCustomGroup={handleRemoveCustomGroup}
        handleAddOptionToGroup={handleAddOptionToGroup}
        handleRemoveOptionFromGroup={handleRemoveOptionFromGroup}
        signatureTarget={signatureTarget}
        setSignatureTarget={setSignatureTarget}
        handleSaveSignature={handleSaveSignature}
        changeModalTarget={changeModalTarget}
        setChangeModalTarget={setChangeModalTarget}
        receivedCash={receivedCash}
        setReceivedCash={setReceivedCash}
        adminConfirmModal={adminConfirmModal}
        closeAdminConfirmModal={closeAdminConfirmModal}
        showVoiceSettingsModal={showVoiceSettingsModal}
        setShowVoiceSettingsModal={setShowVoiceSettingsModal}
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