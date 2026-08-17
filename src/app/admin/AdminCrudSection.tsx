'use client';

import { useState, useMemo } from 'react';
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
  onCreateStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (id: string) => void;
  onCreateCategory: () => void;
  onMoveCategory: (id: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (id: string) => void;
  onCreateMenuItem: () => void;
  onEditMenuItem: (item: MenuItem) => void;
  onOpenBatchImportModal?: () => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleMenuItemActive: (id: string) => void;
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
}

export function AdminCrudSection({
  viewMode = 'desktop',
  stores,
  categories,
  menuItems,
  paymentMethods,
  soldOutOptions,
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
}: AdminCrudSectionProps) {
  // 控制是否進入特定店家的「專屬菜單工作室」
  const [activeStudioStoreId, setActiveStudioStoreId] = useState<string | null>(null);
  const isDesktop = viewMode === 'desktop';
  const activeStudioStore = useMemo(
    () => stores.find((s) => s.id === activeStudioStoreId),
    [stores, activeStudioStoreId]
  );

  // 第二層：🥤 專屬菜單設計工作室
  if (activeStudioStore) {
    return (
      <AdminMenuStudio
        isDesktop={isDesktop}
        activeStudioStore={activeStudioStore}
        categories={categories}
        menuItems={menuItems}
        onBackToHub={() => setActiveStudioStoreId(null)}
        onEditStore={onEditStore}
        onCreateMenuItem={onCreateMenuItem}
        onEditMenuItem={onEditMenuItem}
        onOpenBatchImportModal={onOpenBatchImportModal}
        onDeleteMenuItem={onDeleteMenuItem}
        onToggleMenuItemActive={onToggleMenuItemActive}
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
      onSelectStudioStore={(storeId) => setActiveStudioStoreId(storeId)}
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
