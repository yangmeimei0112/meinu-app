'use client';

import Header from '@/components/Header';
import OfflineBanner from '@/components/OfflineBanner';
import AdminTopBar from './components/AdminTopBar';
import AdminTabsNav from './components/AdminTabsNav';
import { AdminMobileBottomNav } from './components/AdminMobileBottomNav';
import { AdminDashboardSection } from './AdminDashboardSection';
import { AdminCrudSection } from './AdminCrudSection';
import { AdminArchiveSection } from './AdminArchiveSection';
import { AdminMaintenanceSection } from './components/AdminMaintenanceSection';
import AdminAuthLock from './components/AdminAuthLock';
import { AdminModalsContainer } from './components/modals/AdminModalsContainer';
import { useAdminPageCoordinator } from './hooks/useAdminPageCoordinator';
import { Store, MenuItem } from '@/types/database';

export default function AdminPageContent() {
  const c = useAdminPageCoordinator();

  // 🔒 若尚未解鎖後台密碼，渲染安全驗證卡片
  if (!c.isUnlocked) {
    return <AdminAuthLock onUnlockSuccess={() => c.setIsUnlocked(true)} onInitAudio={c.initAudio} />;
  }

  return (
    <div
      onClick={c.initAudio}
      className="min-h-[100dvh] bg-slate-50 dark:bg-[#080D1A] text-slate-800 dark:text-slate-100 flex flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-10 select-none transition-colors duration-200"
    >
      {/* 電腦版保留全站 Header，手機版直接由 AdminTopBar 單行緊湊展示，避免頂部過度擁擠 */}
      <div className="hidden sm:block">
        <Header />
      </div>
      <OfflineBanner />

      {/* 浮動提示 Toast */}
      {c.toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          {c.toastMessage}
        </div>
      )}

      {/* 團長控制台頂部功能列 (手機緊湊/電腦完整) */}
      <AdminTopBar
        isSoundEnabled={c.isSoundEnabled}
        handleToggleSound={c.handleToggleSound}
        isSpeechEnabled={c.isSpeechEnabled}
        isSpeaking={c.isSpeaking}
        toggleSpeech={c.toggleSpeech}
        onOpenVoiceSettings={() => c.setShowVoiceSettingsModal(true)}
        viewMode={c.viewMode}
        handleToggleViewMode={c.handleToggleViewMode}
        theme={c.theme}
        toggleTheme={c.toggleTheme}
        handleLogout={c.handleLogout}
        showToast={c.showToast}
      />

      {/* 電腦版分頁 Tab 導覽切換 (手機版由底部導覽列接管) */}
      <AdminTabsNav
        activeTab={c.activeTab}
        setActiveTab={c.setActiveTab}
        activeSubmissionsCount={c.submissions.length}
      />

      <main className={`mx-auto p-3 sm:p-4 transition-all duration-200 ${c.isDesktop ? 'max-w-7xl' : 'max-w-md'}`}>
        {c.loading ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs animate-pulse">
            正在同步最新團購資料...
          </div>
        ) : (
          <>
            {c.activeTab === 'active' && (
              <AdminDashboardSection
                viewMode={c.viewMode}
                groupOrder={c.activeGroup}
                activeGroups={c.activeGroups}
                selectedActiveGroupId={c.selectedActiveGroupId}
                onSelectActiveGroup={c.handleSelectActiveGroup}
                submissions={c.submissions}
                itemSummary={c.itemSummary}
                grandTotal={c.grandTotal}
                paidTotal={c.paidTotal}
                inputDeliveryFee={c.inputDeliveryFee}
                inputDiscount={c.inputDiscount}
                roundingRule={c.roundingRule}
                selectedSubmissionIds={c.selectedSubmissionIds}
                setSelectedSubmissionIds={c.setSelectedSubmissionIds}
                calculateAdjustedAmount={c.calculateAdjustedAmount}
                setInputDeliveryFee={c.setInputDeliveryFee}
                setInputDiscount={c.setInputDiscount}
                setRoundingRule={c.setRoundingRule}
                handleApplyFeeSplit={c.handleApplyFeeSplit}
                handleBatchMarkPaid={c.handleBatchMarkPaid}
                handleTogglePaid={c.handleTogglePaid}
                handleUpdateProgressStatus={c.handleUpdateProgressStatus}
                handleBatchUpdateProgressStatus={c.handleBatchUpdateProgressStatus}
                setSignatureTarget={c.setSignatureTarget}
                setChangeModalTarget={c.setChangeModalTarget}
                handleCopyPersonalReceipt={c.handleCopyPersonalReceipt}
                handleCopyStoreOrderText={c.handleCopyStoreOrderText}
                handleCopyUnpaidReminder={c.handleCopyUnpaidReminder}
                handleExportOrdersCSV={c.handleExportOrdersCSV}
                handleOpenPrintModal={() => c.setIsPrintModalOpen(true)}
                handleOpenManualOrderModal={() => c.setIsManualOrderModalOpen(true)}
                handleOpenGroupSettingsModal={() => c.setIsGroupSettingsModalOpen(true)}
                handleArchiveGroup={c.handleArchiveGroup}
                handleToggleGroupStatus={c.handleToggleGroupStatus}
                handleDeleteOrder={c.handleDeleteOrder}
                handleBatchDeleteOrders={c.handleBatchDeleteOrders}
              />
            )}

            {c.activeTab === 'crud' && (
              <AdminCrudSection
                viewMode={c.viewMode}
                stores={c.stores}
                categories={c.categories}
                menuItems={c.allMenuItems}
                paymentMethods={c.paymentMethods}
                soldOutOptions={c.soldOutOptions}
                selectedStudioStoreId={c.selectedCrudStoreId}
                onSelectStudioStore={(storeId) => c.setSelectedCrudStoreId(storeId)}
                onCreateStore={c.openCreateStoreModal}
                onEditStore={(store: Store) => c.openEditStoreModal(store)}
                onDeleteStore={(id: string) => {
                  const store = c.stores.find((s) => s.id === id);
                  if (store) c.handleDeleteStore(id, store.name);
                }}
                onCreateCategory={c.openCreateCategoryModal}
                onMoveCategory={(id: string, direction: 'up' | 'down') => {
                  const category = c.categories.find((cat) => cat.id === id);
                  if (category) c.handleMoveCategory(category, direction);
                }}
                onDeleteCategory={(id: string) => {
                  const category = c.categories.find((cat) => cat.id === id);
                  if (category) c.handleDeleteCategory(id, category.name);
                }}
                onCreateMenuItem={(storeId) => c.openCreateProductModal(storeId || (c.stores[0]?.id ?? ''))}
                onEditMenuItem={(item: MenuItem) => c.openEditProductModal(item)}
                onOpenBatchImportModal={(storeId) => {
                  if (storeId) c.setSelectedCrudStoreId(storeId);
                  c.setIsBatchImportModalOpen(true);
                }}
                onDeleteMenuItem={(id: string) => {
                  const product = c.allMenuItems.find((p) => p.id === id);
                  if (product) c.handleDeleteProduct(id, product.name);
                }}
                onToggleMenuItemActive={(id: string) => {
                  const product = c.allMenuItems.find((p) => p.id === id);
                  if (product) c.handleToggleProductSoldOut(id, product.is_sold_out);
                }}
                onReorderMenuItems={c.handleReorderProducts}
                onCreatePaymentMethod={c.handleCreatePaymentMethod}
                onDeletePaymentMethod={c.handleDeletePaymentMethod}
                onTogglePaymentMethodActive={c.handleTogglePaymentMethodActive}
                onUpdatePaymentMethod={(id: string, field: 'name' | 'account_info', value: string | null) => {
                  c.setPaymentMethods((prev) =>
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
                onSavePaymentMethod={c.handleSavePaymentMethod}
                onCreateSoldOutOption={c.onCreateSoldOutOption}
                onDeleteSoldOutOption={c.onDeleteSoldOutOption}
                onMoveSoldOutOption={c.onMoveSoldOutOption}
                onUpdateSoldOutOption={(id: string, title: string) => {
                  c.setSoldOutOptions((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)));
                }}
                onSaveSoldOutOption={c.onSaveSoldOutOption}
                onUpdateCategory={(id: string, field: 'name', value: string) => {
                  if (field === 'name' && typeof value === 'string') {
                    c.setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name: value } : cat)));
                  }
                }}
                onRefreshData={c.fetchAdminData}
                showToast={c.showToast}
              />
            )}

            {c.activeTab === 'archive' && (
              <AdminArchiveSection
                viewMode={c.viewMode}
                archivedGroups={c.archivedGroups}
                selectedArchivedGroupId={c.selectedArchivedGroupId}
                setSelectedArchivedGroupId={c.setSelectedArchivedGroupId}
                handleReopenGroup={c.handleReopenGroup}
                handleDeleteArchivedGroup={c.handleDeleteArchivedGroup}
                handleBatchDeleteArchivedGroups={c.handleBatchDeleteArchivedGroups}
              />
            )}

            {c.activeTab === 'maintenance' && (
              <AdminMaintenanceSection showToast={c.showToast} />
            )}
          </>
        )}
      </main>

      {/* 📱 手機版專屬底部懸浮分頁導覽列 (< 640px) */}
      <AdminMobileBottomNav
        activeTab={c.activeTab}
        setActiveTab={c.setActiveTab}
        activeSubmissionsCount={c.submissions.length}
      />

      {/* 🌟 集中化掛載後台所有彈窗 */}
      <AdminModalsContainer
        isPrintModalOpen={c.isPrintModalOpen}
        setIsPrintModalOpen={c.setIsPrintModalOpen}
        activeGroup={c.activeGroup}
        submissions={c.submissions}
        itemSummary={c.itemSummary}
        grandTotal={c.grandTotal}
        isManualOrderModalOpen={c.isManualOrderModalOpen}
        setIsManualOrderModalOpen={c.setIsManualOrderModalOpen}
        allMenuItems={c.allMenuItems}
        paymentMethods={c.paymentMethods}
        soldOutOptions={c.soldOutOptions}
        fetchAdminData={c.fetchAdminData}
        isBatchImportModalOpen={c.isBatchImportModalOpen}
        setIsBatchImportModalOpen={c.setIsBatchImportModalOpen}
        selectedCrudStoreId={c.selectedCrudStoreId}
        stores={c.stores}
        isGroupSettingsModalOpen={c.isGroupSettingsModalOpen}
        setIsGroupSettingsModalOpen={c.setIsGroupSettingsModalOpen}
        handleSaveGroupSettings={c.handleSaveGroupSettings}
        isStoreModalOpen={c.isStoreModalOpen}
        setIsStoreModalOpen={c.setIsStoreModalOpen}
        editingStore={c.editingStore}
        categories={c.categories}
        storeForm={c.storeForm}
        setStoreForm={c.setStoreForm}
        storeImagePreview={c.storeImagePreview}
        uploadingImage={c.uploadingImage}
        handleSaveStore={c.handleSaveStore}
        handleStoreImageChange={c.handleStoreImageChange}
        isCatModalOpen={c.isCatModalOpen}
        setIsCatModalOpen={c.setIsCatModalOpen}
        editingCat={c.editingCat}
        catNameInput={c.catNameInput}
        setCatNameInput={c.setCatNameInput}
        handleSaveCategory={c.handleSaveCategory}
        isProductModalOpen={c.isProductModalOpen}
        setIsProductModalOpen={c.setIsProductModalOpen}
        editingProduct={c.editingProduct}
        productForm={c.productForm}
        setProductForm={c.setProductForm}
        productCustomGroups={c.productCustomGroups}
        setProductCustomGroups={c.setProductCustomGroups}
        handleSaveProduct={c.handleSaveProduct}
        handleAddCustomGroup={c.handleAddCustomGroup}
        handleRemoveCustomGroup={c.handleRemoveCustomGroup}
        handleAddOptionToGroup={c.handleAddOptionToGroup}
        handleRemoveOptionFromGroup={c.handleRemoveOptionFromGroup}
        signatureTarget={c.signatureTarget}
        setSignatureTarget={c.setSignatureTarget}
        handleSaveSignature={c.handleSaveSignature}
        changeModalTarget={c.changeModalTarget}
        setChangeModalTarget={c.setChangeModalTarget}
        receivedCash={c.receivedCash}
        setReceivedCash={c.setReceivedCash}
        adminConfirmModal={c.adminConfirmModal}
        closeAdminConfirmModal={c.closeAdminConfirmModal}
        deleteChoiceTarget={c.deleteChoiceTarget}
        setDeleteChoiceTarget={c.setDeleteChoiceTarget}
        handleConfirmDeleteChoice={c.handleConfirmDeleteChoice}
        showVoiceSettingsModal={c.showVoiceSettingsModal}
        setShowVoiceSettingsModal={c.setShowVoiceSettingsModal}
        isSpeechEnabled={c.isSpeechEnabled}
        toggleSpeech={c.toggleSpeech}
        speechMode={c.speechMode}
        setSpeechMode={c.setSpeechMode}
        speechRate={c.speechRate}
        setSpeechRate={c.setSpeechRate}
        playTestSpeech={c.playTestSpeech}
      />
    </div>
  );
}