'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/lib/theme';
import { useAdminSound } from './useAdminSound';
import { useAdminSpeech } from './useAdminSpeech';
import { useAdminModalState } from './useAdminModalState';
import { useAdminData } from './useAdminData';
import { useAdminStoreCrud } from './useAdminStoreCrud';
import { useAdminGlobalSettingsCrud } from './useAdminGlobalSettingsCrud';
import { useAdminOrderActions } from './useAdminOrderActions';
import { AdminViewMode, GroupOrderAdmin } from '../admin-types';

export function useAdminPageCoordinator() {
  const { theme, toggleTheme } = useTheme();

  // 1. 後台音效與語音播報 Hook
  const { isSoundEnabled, toggleSound, playNewOrderSound, initAudio } = useAdminSound();
  const {
    isSpeechEnabled,
    isSpeaking,
    speechMode,
    speechRate,
    setSpeechMode,
    setSpeechRate,
    toggleSpeech,
    speakNewOrder,
    playTestSpeech,
  } = useAdminSpeech();

  // 2. 視圖模式與介面狀態
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'active' | 'crud' | 'archive' | 'maintenance'>('active');
  const [viewMode, setViewMode] = useState<AdminViewMode>('desktop');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  }, []);

  // Modal 狀態 Hook
  const {
    showVoiceSettingsModal,
    setShowVoiceSettingsModal,
    adminConfirmModal,
    openAdminConfirmModal,
    closeAdminConfirmModal,
    signatureTarget,
    setSignatureTarget,
  } = useAdminModalState();

  // 3. 核心業務資料檢索與 Realtime 監聽 Hook
  const {
    loading,
    stores,
    categories,
    allMenuItems,
    paymentMethods,
    soldOutOptions,
    activeGroups,
    archivedGroups,
    activeGroup,
    submissions,
    allSubmissions,
    selectedActiveGroupId,
    selectedActiveGroupIdRef,
    itemSummary,
    grandTotal,
    paidTotal,
    inputDeliveryFee,
    inputDiscount,
    roundingRule,
    setCategories,
    setPaymentMethods,
    setSoldOutOptions,
    setActiveGroup,
    setAllSubmissions,
    setSelectedActiveGroupId,
    setInputDeliveryFee,
    setInputDiscount,
    setRoundingRule,
    fetchAdminData,
    optimisticReorderMenuItems,
  } = useAdminData({
    isUnlocked,
    playNewOrderSound,
    speakNewOrder,
    showToast,
  });

  // 4. 店家、分類、餐點品項 CRUD 操作 Hook
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

  // 5. 全域設定（付款方式、缺貨備案、分類順序）Hook
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

  // 6. 訂單對帳、平攤、簽名與匯出 Hook
  const {
    isPrintModalOpen,
    setIsPrintModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isBatchImportModalOpen,
    setIsBatchImportModalOpen,
    isGroupSettingsModalOpen,
    setIsGroupSettingsModalOpen,
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
  }, [setViewMode]);

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

  const handleSelectActiveGroup = (groupId: string) => {
    setSelectedActiveGroupId(groupId);
    selectedActiveGroupIdRef.current = groupId;
    if (groupId !== 'all') {
      const g = activeGroups.find((item: GroupOrderAdmin) => item.id === groupId);
      if (g) {
        setActiveGroup(g);
        setInputDeliveryFee(g.delivery_fee || 0);
        setInputDiscount(g.discount_amount || 0);
        setRoundingRule((g.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
      }
    } else if (activeGroups.length > 0) {
      const g = activeGroups.find((item: GroupOrderAdmin) => (item.order_count || 0) > 0) || activeGroups[0];
      if (g) {
        setActiveGroup(g);
        setInputDeliveryFee(g.delivery_fee || 0);
        setInputDiscount(g.discount_amount || 0);
        setRoundingRule((g.rounding_rule as 'floor' | 'ceil' | 'round') || 'floor');
      }
    }
  };

  return {
    theme,
    toggleTheme,
    isUnlocked,
    setIsUnlocked,
    initAudio,
    isSoundEnabled,
    handleToggleSound,
    isSpeechEnabled,
    isSpeaking,
    toggleSpeech,
    setShowVoiceSettingsModal,
    viewMode,
    handleToggleViewMode,
    handleLogout,
    showToast,
    toastMessage,
    activeTab,
    setActiveTab,
    isDesktop,
    loading,
    activeGroup,
    activeGroups,
    selectedActiveGroupId,
    handleSelectActiveGroup,
    submissions,
    itemSummary,
    grandTotal,
    paidTotal,
    inputDeliveryFee,
    inputDiscount,
    roundingRule,
    selectedSubmissionIds,
    setSelectedSubmissionIds,
    calculateAdjustedAmount,
    setInputDeliveryFee,
    setInputDiscount,
    setRoundingRule,
    handleApplyFeeSplit,
    handleBatchMarkPaid,
    handleTogglePaid,
    handleUpdateProgressStatus,
    handleBatchUpdateProgressStatus,
    setSignatureTarget,
    setChangeModalTarget,
    handleCopyPersonalReceipt,
    handleCopyStoreOrderText,
    handleCopyUnpaidReminder,
    handleExportOrdersCSV,
    isPrintModalOpen,
    setIsPrintModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isGroupSettingsModalOpen,
    setIsGroupSettingsModalOpen,
    handleArchiveGroup,
    handleToggleGroupStatus,
    handleDeleteOrder,
    handleBatchDeleteOrders,
    stores,
    categories,
    allMenuItems,
    paymentMethods,
    soldOutOptions,
    selectedCrudStoreId,
    setSelectedCrudStoreId,
    openCreateStoreModal,
    openEditStoreModal,
    handleDeleteStore,
    openCreateCategoryModal,
    handleMoveCategory,
    handleDeleteCategory,
    openCreateProductModal,
    openEditProductModal,
    isBatchImportModalOpen,
    setIsBatchImportModalOpen,
    handleDeleteProduct,
    handleToggleProductSoldOut,
    handleReorderProducts,
    handleCreatePaymentMethod,
    handleDeletePaymentMethod,
    handleTogglePaymentMethodActive,
    setPaymentMethods,
    handleSavePaymentMethod,
    onCreateSoldOutOption,
    onDeleteSoldOutOption,
    onMoveSoldOutOption,
    setSoldOutOptions,
    onSaveSoldOutOption,
    setCategories,
    archivedGroups,
    selectedArchivedGroupId,
    setSelectedArchivedGroupId,
    handleReopenGroup,
    handleDeleteArchivedGroup,
    handleBatchDeleteArchivedGroups,
    fetchAdminData,
    handleSaveGroupSettings,
    isStoreModalOpen,
    setIsStoreModalOpen,
    editingStore,
    storeForm,
    setStoreForm,
    storeImagePreview,
    uploadingImage,
    handleSaveStore,
    handleStoreImageChange,
    isCatModalOpen,
    setIsCatModalOpen,
    editingCat,
    catNameInput,
    setCatNameInput,
    handleSaveCategory,
    isProductModalOpen,
    setIsProductModalOpen,
    editingProduct,
    productForm,
    setProductForm,
    productCustomGroups,
    setProductCustomGroups,
    handleSaveProduct,
    handleAddCustomGroup,
    handleRemoveCustomGroup,
    handleAddOptionToGroup,
    handleRemoveOptionFromGroup,
    signatureTarget,
    handleSaveSignature,
    changeModalTarget,
    receivedCash,
    setReceivedCash,
    adminConfirmModal,
    closeAdminConfirmModal,
    showVoiceSettingsModal,
    speechMode,
    setSpeechMode,
    speechRate,
    setSpeechRate,
    playTestSpeech,
  };
}
