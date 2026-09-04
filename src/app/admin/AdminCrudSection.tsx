'use client';

import { useMemo } from 'react';
import type { Category, MenuItem, PaymentMethod, SoldOutOption, Store } from '@/types/database';
import { AdminViewMode } from './admin-types';
import AdminMenuStudio from './components/AdminMenuStudio';
import AdminStoreHub from './components/AdminStoreHub';

interface AdminCrudSectionProps {
  viewMode?: AdminViewMode;
  stores: Store[];
  categories: Category[];
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  selectedStudioStoreId: string | null;
  onSelectStudioStore: (id: string | null) => void;
  onCreateStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (id: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (id: string) => void;
  onCreateMenuItem: (storeId?: string) => void;
  onEditMenuItem: (item: MenuItem) => void;
  onOpenBatchImportModal?: (storeId?: string) => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleMenuItemActive: (id: string) => void;
  onReorderMenuItems?: (storeId: string, orderedItemIds: string[]) => void;
  onCreatePaymentMethod: () => void;
  onDeletePaymentMethod: (id: string) => void;
  onTogglePaymentMethodActive: (id: string, currentStatus: boolean) => void;
  onUpdatePaymentMethod: (id: string, field: 'name' | 'account_info', value: string | null) => void;
  onSavePaymentMethod: (id: string, payload: { name: string; account_info: string | null }) => void;
  onCreateSoldOutOption: () => void;
  onDeleteSoldOutOption: (id: string) => void;
  onMoveSoldOutOption: (id: string, direction: 'up' | 'down') => void;
  onUpdateSoldOutOption: (id: string, title: string) => void;
  onSaveSoldOutOption: (id: string, title: string) => void;
  onUpdateCategory: (id: string, field: 'name', value: string) => void;
  onRefreshData?: () => void;
  showToast?: (msg: string) => void;
}

export function AdminCrudSection({
  viewMode = 'desktop',
  stores,
  categories,
  menuItems,
  paymentMethods,
  soldOutOptions,
  selectedStudioStoreId,
  onSelectStudioStore,
  onCreateStore,
  onEditStore,
  onDeleteStore,
  onCreateCategory,
  onMoveCategory,
  onDeleteCategory,
  onCreateMenuItem,
  onEditMenuItem,
  onOpenBatchImportModal,
  onDeleteMenuItem,
  onToggleMenuItemActive,
  onReorderMenuItems,
  onCreatePaymentMethod,
  onDeletePaymentMethod,
  onTogglePaymentMethodActive,
  onUpdatePaymentMethod,
  onSavePaymentMethod,
  onCreateSoldOutOption,
  onDeleteSoldOutOption,
  onMoveSoldOutOption,
  onUpdateSoldOutOption,
  onSaveSoldOutOption,
  onUpdateCategory,
  onRefreshData,
  showToast,
}: AdminCrudSectionProps) {
  const isDesktop = viewMode === 'desktop';
  const activeStudioStore = useMemo(
    () => stores.find((s) => s.id === selectedStudioStoreId),
    [stores, selectedStudioStoreId]
  );

  // 第二層：🥤 專屬菜單設計工作室
  if (activeStudioStore) {
    return (
      <AdminMenuStudio
        isDesktop={isDesktop}
        activeStudioStore={activeStudioStore}
        categories={categories}
        menuItems={menuItems}
        onBackToHub={() => onSelectStudioStore(null)}
        onEditStore={onEditStore}
        onCreateMenuItem={() => onCreateMenuItem(activeStudioStore.id)}
        onEditMenuItem={onEditMenuItem}
        onOpenBatchImportModal={
          onOpenBatchImportModal ? () => onOpenBatchImportModal(activeStudioStore.id) : undefined
        }
        onDeleteMenuItem={onDeleteMenuItem}
        onToggleMenuItemActive={onToggleMenuItemActive}
        onReorderMenuItems={onReorderMenuItems}
        onRefreshData={onRefreshData}
        showToast={showToast}
      />
    );
  }

  // 第一層：🏪 合作店家管理總覽
  return (
    <AdminStoreHub
      isDesktop={isDesktop}
      stores={stores}
      categories={categories}
      menuItems={menuItems}
      paymentMethods={paymentMethods}
      soldOutOptions={soldOutOptions}
      onSelectStudioStore={(storeId) => onSelectStudioStore(storeId)}
      onCreateStore={onCreateStore}
      onEditStore={onEditStore}
      onDeleteStore={onDeleteStore}
      onCreateCategory={onCreateCategory}
      onMoveCategory={onMoveCategory}
      onDeleteCategory={onDeleteCategory}
      onUpdateCategory={onUpdateCategory}
      onCreatePaymentMethod={onCreatePaymentMethod}
      onDeletePaymentMethod={onDeletePaymentMethod}
      onTogglePaymentMethodActive={onTogglePaymentMethodActive}
      onUpdatePaymentMethod={onUpdatePaymentMethod}
      onSavePaymentMethod={onSavePaymentMethod}
      onCreateSoldOutOption={onCreateSoldOutOption}
      onDeleteSoldOutOption={onDeleteSoldOutOption}
      onMoveSoldOutOption={onMoveSoldOutOption}
      onUpdateSoldOutOption={onUpdateSoldOutOption}
      onSaveSoldOutOption={onSaveSoldOutOption}
    />
  );
}
