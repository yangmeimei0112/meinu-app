'use client';

import React from 'react';
import type { Store, Category, MenuItem, PaymentMethod, SoldOutOption, CustomGroup } from '@/types/database';
import type { OrderSubmissionAdmin, GroupOrderAdmin, AdminConfirmModalState } from '../../admin-types';
import type { SpeechMode } from '../../hooks/useAdminSpeech';
import AdminPrintModal from '../../AdminPrintModal';
import AdminManualOrderModal from '../../AdminManualOrderModal';
import AdminBatchImportModal from '../../AdminBatchImportModal';
import AdminGroupSettingsModal from '../../AdminGroupSettingsModal';
import AdminStoreModal from '../AdminStoreModal';
import AdminCategoryModal from '../AdminCategoryModal';
import AdminProductModal from '../AdminProductModal';
import AdminChangeModal from '../AdminChangeModal';
import AdminVoiceSettingsModal from '../AdminVoiceSettingsModal';
import SignatureModal from '@/components/SignatureModal';
import DoubleConfirmModal from '@/components/DoubleConfirmModal';

interface ProductFormState {
  name: string;
  price: string;
  description: string;
  stock_quantity: string;
  is_sold_out: boolean;
}

interface AdminModalsContainerProps {
  // 列印 Modal
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (open: boolean) => void;
  activeGroup: GroupOrderAdmin | null;
  submissions: OrderSubmissionAdmin[];
  itemSummary: Record<string, number>;
  grandTotal: number;

  // 人工代點 Modal
  isManualOrderModalOpen: boolean;
  setIsManualOrderModalOpen: (open: boolean) => void;
  allMenuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;

  // CSV 批量匯入 Modal
  isBatchImportModalOpen: boolean;
  setIsBatchImportModalOpen: (open: boolean) => void;
  selectedCrudStoreId: string | null;
  stores: Store[];

  // 團購設定 Modal
  isGroupSettingsModalOpen: boolean;
  setIsGroupSettingsModalOpen: (open: boolean) => void;
  handleSaveGroupSettings: (updatedData: {
    title: string;
    store_id: string;
    announcement: string | null;
    enable_min_threshold: boolean;
    min_threshold_amount: number;
    enable_countdown: boolean;
    cutoff_time: string | null;
    enable_budget_limit: boolean;
    budget_limit_amount: number;
  }) => Promise<void>;

  // 店家 Modal
  isStoreModalOpen: boolean;
  setIsStoreModalOpen: (open: boolean) => void;
  editingStore: Store | null;
  categories: Category[];
  storeForm: { name: string; category_id: string; code_number: string };
  setStoreForm: React.Dispatch<React.SetStateAction<{ name: string; category_id: string; code_number: string }>>;
  storeImagePreview: string;
  uploadingImage: boolean;
  handleSaveStore: (e: React.FormEvent) => Promise<void>;
  handleStoreImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // 分類 Modal
  isCatModalOpen: boolean;
  setIsCatModalOpen: (open: boolean) => void;
  editingCat: Category | null;
  catNameInput: string;
  setCatNameInput: (name: string) => void;
  handleSaveCategory: (e: React.FormEvent) => Promise<void>;

  // 餐點 Modal
  isProductModalOpen: boolean;
  setIsProductModalOpen: (open: boolean) => void;
  editingProduct: MenuItem | null;
  productForm: ProductFormState;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  productCustomGroups: CustomGroup[];
  setProductCustomGroups: React.Dispatch<React.SetStateAction<CustomGroup[]>>;
  handleSaveProduct: (e: React.FormEvent) => void;
  handleAddCustomGroup: () => void;
  handleRemoveCustomGroup: (groupId: string) => void;
  handleAddOptionToGroup: (groupId: string) => void;
  handleRemoveOptionFromGroup: (groupId: string, optionId: string) => void;

  // 簽名 Modal
  signatureTarget: OrderSubmissionAdmin | null;
  setSignatureTarget: (target: OrderSubmissionAdmin | null) => void;
  handleSaveSignature: (signatureData: string) => Promise<void>;

  // 現金找零 Modal
  changeModalTarget: { nickname: string; amount: number } | null;
  setChangeModalTarget: React.Dispatch<React.SetStateAction<{ nickname: string; amount: number } | null>>;
  receivedCash: string;
  setReceivedCash: (cash: string) => void;

  // 二次確認 Modal
  adminConfirmModal: AdminConfirmModalState;
  closeAdminConfirmModal: () => void;

  // 語音設定 Modal
  showVoiceSettingsModal: boolean;
  setShowVoiceSettingsModal: (open: boolean) => void;
  isSpeechEnabled: boolean;
  toggleSpeech: () => boolean;
  speechMode: SpeechMode;
  setSpeechMode: (mode: SpeechMode) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  playTestSpeech: () => void;
}

export function AdminModalsContainer({
  isPrintModalOpen,
  setIsPrintModalOpen,
  activeGroup,
  submissions,
  itemSummary,
  grandTotal,
  isManualOrderModalOpen,
  setIsManualOrderModalOpen,
  allMenuItems,
  paymentMethods,
  soldOutOptions,
  fetchAdminData,
  isBatchImportModalOpen,
  setIsBatchImportModalOpen,
  selectedCrudStoreId,
  stores,
  isGroupSettingsModalOpen,
  setIsGroupSettingsModalOpen,
  handleSaveGroupSettings,
  isStoreModalOpen,
  setIsStoreModalOpen,
  editingStore,
  categories,
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
  setSignatureTarget,
  handleSaveSignature,
  changeModalTarget,
  setChangeModalTarget,
  receivedCash,
  setReceivedCash,
  adminConfirmModal,
  closeAdminConfirmModal,
  showVoiceSettingsModal,
  setShowVoiceSettingsModal,
  isSpeechEnabled,
  toggleSpeech,
  speechMode,
  setSpeechMode,
  speechRate,
  setSpeechRate,
  playTestSpeech,
}: AdminModalsContainerProps) {
  return (
    <>
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
    </>
  );
}
