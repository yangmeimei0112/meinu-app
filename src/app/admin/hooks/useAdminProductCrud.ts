'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CustomGroup } from '@/types/database';
import { AdminConfirmModalState } from '../admin-types';
import { patchStoreMenuItem } from '@/lib/storeMenuCache';
import { formatErrorMessage } from '@/lib/errorUtils';

interface UseAdminProductCrudProps {
  optimisticReorderMenuItems?: (storeId: string, orderedItemIds: string[]) => void;
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
}

export function useAdminProductCrud({
  optimisticReorderMenuItems,
  fetchAdminData,
  showToast,
  openAdminConfirmModal,
  closeAdminConfirmModal,
}: UseAdminProductCrudProps) {
  const [selectedCrudStoreId, setSelectedCrudStoreId] = useState<string | null>(null);
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

  const openCreateProductModal = (storeId: string) => {
    setSelectedCrudStoreId(storeId);
    setEditingProduct(null);
    setProductForm({ name: '', price: '', description: '', stock_quantity: '', is_sold_out: false });
    setProductCustomGroups([]);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: MenuItem) => {
    setSelectedCrudStoreId(product.store_id);
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      price: String(product.price),
      description: product.description || '',
      stock_quantity: product.stock_quantity !== null && product.stock_quantity !== undefined ? String(product.stock_quantity) : '',
      is_sold_out: product.is_sold_out,
    });
    setProductCustomGroups(product.custom_groups || []);
    setIsProductModalOpen(true);
  };

  // 客製化群組操作
  const handleAddCustomGroup = () => {
    const newGroup: CustomGroup = {
      id: `group-${Date.now()}`,
      title: '',
      type: 'single',
      options: [],
    };
    setProductCustomGroups((prev) => [...prev, newGroup]);
  };

  const handleRemoveCustomGroup = (groupId: string) => {
    setProductCustomGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    setProductCustomGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: [
              ...g.options,
              {
                id: `opt-${Date.now()}`,
                name: '',
                price_adjustment: 0,
              },
            ],
          };
        }
        return g;
      })
    );
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setProductCustomGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.filter((opt) => opt.id !== optionId),
          };
        }
        return g;
      })
    );
  };

  // 儲存餐點
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price) return;

    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      description: productForm.description.trim() || null,
      stock_quantity: productForm.stock_quantity ? Number(productForm.stock_quantity) : null,
      is_sold_out: productForm.is_sold_out,
      custom_groups: productCustomGroups,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editingProduct.id);

      if (error) {
        console.error('更新餐點失敗:', error);
        showToast(formatErrorMessage(error, '更新餐點失敗，請檢查網路連線'));
        return;
      }
      showToast('餐點已更新！');
    } else {
      if (!selectedCrudStoreId) return;

      const { error } = await supabase
        .from('menu_items')
        .insert([{ ...payload, store_id: selectedCrudStoreId }]);

      if (error) {
        console.error('新增餐點失敗:', error);
        showToast(formatErrorMessage(error, '新增餐點失敗，請檢查輸入資料'));
        return;
      }
      showToast('餐點新增成功！');
    }

    setIsProductModalOpen(false);
    fetchAdminData();
  };

  // 刪除餐點
  const handleDeleteProduct = (productId: string, name: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除餐點',
      message: `確定要刪除餐點「${name}」嗎？此動作將一併刪除其所有客製選項與歷史明細關聯，且無法復原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { error } = await supabase.from('menu_items').delete().eq('id', productId);
          if (error) throw error;
          showToast(`已刪除餐點「${name}」`);
          fetchAdminData();
        } catch (err: any) {
          console.error('刪除餐點失敗:', err);
          showToast(`刪除餐點失敗：${formatErrorMessage(err, '資料庫關聯衝突，無法刪除')}`);
        }
      },
    });
  };

  // 切換餐點售罄狀態
  const handleToggleProductSoldOut = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    if (selectedCrudStoreId) {
      patchStoreMenuItem(selectedCrudStoreId, productId, { is_sold_out: newStatus });
    }

    const { error } = await supabase
      .from('menu_items')
      .update({ is_sold_out: newStatus })
      .eq('id', productId);

    if (error) {
      console.error('更新售完狀態失敗:', error);
      showToast('更新售完狀態失敗');
      return;
    }

    showToast(newStatus ? '已設為售完' : '已設為供應中');
    fetchAdminData();
  };

  // 餐點拖曳重排
  const handleReorderProducts = async (storeId: string, orderedItemIds: string[]) => {
    if (optimisticReorderMenuItems) {
      optimisticReorderMenuItems(storeId, orderedItemIds);
    }

    try {
      const res = await fetch('/api/menu/sort-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, orderedItemIds }),
      });

      if (!res.ok) {
        throw new Error('伺服器更新排序失敗');
      }

      showToast('菜單排序已即時儲存！');
    } catch (err) {
      console.error('菜單排序更新出錯:', err);
      showToast('菜單排序更新失敗，正在重新整理');
      fetchAdminData();
    }
  };

  return {
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
  };
}
