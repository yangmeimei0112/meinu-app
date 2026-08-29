'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Category, MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
import { compressImageToWebP } from '@/lib/image-compress';
import { AdminConfirmModalState } from '../admin-types';
import { useAdminCategoryCrud } from './useAdminCategoryCrud';
import { useAdminProductCrud } from './useAdminProductCrud';

interface UseAdminStoreCrudProps {
  stores: Store[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  allMenuItems: MenuItem[];
  optimisticReorderMenuItems?: (storeId: string, orderedItemIds: string[]) => void;
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
}

export function useAdminStoreCrud({
  stores,
  categories,
  allMenuItems,
  optimisticReorderMenuItems,
  fetchAdminData,
  showToast,
  openAdminConfirmModal,
  closeAdminConfirmModal,
}: UseAdminStoreCrudProps) {
  // 店家 Modal 狀態
  const [isStoreModalOpen, setIsStoreModalOpen] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeForm, setStoreForm] = useState({ name: '', category_id: '', code_number: '001' });
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // 1. 分類 CRUD 子模組
  const {
    isCatModalOpen,
    setIsCatModalOpen,
    editingCat,
    setEditingCat,
    catNameInput,
    setCatNameInput,
    openCreateCategoryModal,
    openEditCategoryModal,
    handleSaveCategory,
    handleDeleteCategory,
    handleReorderCategories,
  } = useAdminCategoryCrud({
    categories,
    fetchAdminData,
    showToast,
    openAdminConfirmModal,
    closeAdminConfirmModal,
  });

  // 2. 餐點 CRUD 子模組
  const {
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
  } = useAdminProductCrud({
    allMenuItems,
    optimisticReorderMenuItems,
    fetchAdminData,
    showToast,
    openAdminConfirmModal,
    closeAdminConfirmModal,
  });

  // 3. 店家圖片變更
  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        showToast('不支援的圖片格式！僅允許 JPG、PNG、WebP、GIF 格式的圖片。');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('圖片文件過大！最大允許 10MB。');
        e.target.value = '';
        return;
      }
      try {
        const compressedWebPDataUrl = await compressImageToWebP(file);
        setStoreImagePreview(compressedWebPDataUrl);
        const res = await fetch(compressedWebPDataUrl);
        const blob = await res.blob();
        const compressedFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.webp`, {
          type: 'image/webp',
        });
        setStoreImageFile(compressedFile);
      } catch (err) {
        console.error('WebP 壓縮失敗，使用原始檔案', err);
        setStoreImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setStoreImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // 4. 儲存店家（含 S-??? 專屬編號保存與防重檢驗）
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name.trim()) return;

    setUploadingImage(true);
    let imageUrl = editingStore?.image_url || null;

    if (storeImageFile) {
      const fileExt = storeImageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `stores/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-images')
        .upload(filePath, storeImageFile);

      if (uploadError) {
        console.error('圖片上傳失敗:', uploadError);
        showToast('店家封面圖片上傳失敗');
      } else {
        const { data } = supabase.storage.from('store-images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
    }

    const paddedNum = storeForm.code_number.padStart(3, '0');
    const storeCode = `S-${paddedNum}`;

    try {
      const res = await fetch('/api/stores/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: storeCode,
          storeId: editingStore ? editingStore.id : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || '店家代號已存在，請更換其他編號！');
        setUploadingImage(false);
        return;
      }
    } catch (err) {
      console.error('檢查代號失敗:', err);
    }

    const payload = {
      name: storeForm.name.trim(),
      category_id: storeForm.category_id || null,
      image_url: imageUrl,
      code: storeCode,
    };

    if (editingStore) {
      const { error } = await supabase.from('stores').update(payload).eq('id', editingStore.id);
      if (error) {
        console.error('更新店家失敗:', error);
        showToast('更新店家失敗');
        setUploadingImage(false);
        return;
      }
      showToast('店家資料已更新！');
    } else {
      const { error } = await supabase.from('stores').insert([{ ...payload, is_active: true }]);
      if (error) {
        console.error('新增店家失敗:', error);
        showToast('新增店家失敗');
        setUploadingImage(false);
        return;
      }
      showToast('店家新增成功！');
    }

    setUploadingImage(false);
    setIsStoreModalOpen(false);
    fetchAdminData();
  };

  // 5. 刪除店家
  const handleDeleteStore = (storeId: string, name: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除店家',
      message: `確定要刪除「${name}」嗎？此動作將一併刪除該店家的所有餐點菜單，且無法復原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          await supabase.from('menu_items').delete().eq('store_id', storeId);
          const { error } = await supabase.from('stores').delete().eq('id', storeId);
          if (error) throw error;
          showToast(`已刪除店家「${name}」`);
          fetchAdminData();
        } catch (err: any) {
          console.error('刪除店家失敗:', err);
          showToast(`刪除店家失敗：${err?.message || err}`);
        }
      },
    });
  };

  // 6. 開啟新增/編輯店家 Modal
  const openCreateStoreModal = () => {
    const existingCodes = stores.map((s) => s.code).filter(Boolean);
    let candidateNum = 1;
    while (existingCodes.includes(`S-${String(candidateNum).padStart(3, '0')}`)) {
      candidateNum++;
    }

    setEditingStore(null);
    setStoreForm({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      code_number: String(candidateNum).padStart(3, '0'),
    });
    setStoreImageFile(null);
    setStoreImagePreview('');
    setIsStoreModalOpen(true);
  };

  const openEditStoreModal = (store: Store) => {
    let currentCodeNum = '001';
    if (store.code && store.code.startsWith('S-')) {
      currentCodeNum = store.code.replace('S-', '');
    }

    setEditingStore(store);
    setStoreForm({
      name: store.name,
      category_id: store.category_id || '',
      code_number: currentCodeNum,
    });
    setStoreImageFile(null);
    setStoreImagePreview(store.image_url || '');
    setIsStoreModalOpen(true);
  };

  // 7. 切換店家上下架狀態
  const handleToggleStoreActive = async (storeId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('stores').update({ is_active: newStatus }).eq('id', storeId);

    if (error) {
      console.error('更新店家狀態失敗:', error);
      showToast('更新店家狀態失敗');
      return;
    }

    showToast(newStatus ? '已開啟店家' : '已關閉店家');
    fetchAdminData();
  };

  return {
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
    openCreateStoreModal,
    openEditStoreModal,
    handleToggleStoreActive,

    // 分類子模組
    isCatModalOpen,
    setIsCatModalOpen,
    editingCat,
    setEditingCat,
    catNameInput,
    setCatNameInput,
    openCreateCategoryModal,
    openEditCategoryModal,
    handleSaveCategory,
    handleDeleteCategory,
    handleReorderCategories,

    // 餐點子模組
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
    handleToggleProductStatus: handleToggleProductSoldOut,
    handleReorderProducts,
    handleReorderMenuItems: handleReorderProducts,
  };
}
