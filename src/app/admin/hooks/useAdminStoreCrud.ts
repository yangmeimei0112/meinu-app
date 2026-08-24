'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Category, MenuItem, PaymentMethod, SoldOutOption, CustomGroup } from '@/types/database';
import { compressImageToWebP } from '@/lib/image-compress';
import { AdminConfirmModalState } from '../admin-types';

interface UseAdminStoreCrudProps {
  stores: Store[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  allMenuItems: MenuItem[];
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
}

export function useAdminStoreCrud({
  stores,
  categories,
  paymentMethods,
  soldOutOptions,
  allMenuItems,
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

  // 分類 Modal 狀態
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState<string>('');

  // 餐點 Modal 狀態
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

  // 1. 店家圖片變更
  const handleStoreImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  // 2. 儲存店家（含 S-??? 專屬編號保存與防重檢驗）
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploadingImage(true);
      let imageUrl = editingStore?.image_url || null;

      if (storeImageFile) {
        const fileExt = storeImageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('stores').upload(fileName, storeImageFile);
        if (uploadError) {
          console.error('上傳圖片錯誤:', uploadError);
          showToast('❌ 圖片上傳失敗，請確認 Storage 設定');
          setUploadingImage(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('stores').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const payload = {
        name: storeForm.name.trim(),
        image_url: imageUrl,
        category_id: storeForm.category_id || null,
        is_active: true,
      };

      let targetStoreId = editingStore?.id;

      if (editingStore) {
        const { error } = await supabase.from('stores').update(payload).eq('id', editingStore.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('stores').insert([payload]).select('id').single();
        if (error) throw error;
        targetStoreId = data.id;
      }

      // 儲存 S-??? 商家編號
      if (targetStoreId) {
        const codeRes = await fetch('/api/stores/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: targetStoreId,
            codeNumber: storeForm.code_number || '001',
          }),
        });

        const codeJson = await codeRes.json();
        if (!codeRes.ok) {
          throw new Error(codeJson?.message || '儲存商家編號失敗');
        }
      }

      showToast(editingStore ? '✅ 店家資訊與編號已更新！' : '🎉 新增合作店家成功！');
      setIsStoreModalOpen(false);
      setEditingStore(null);
      setStoreForm({ name: '', category_id: '', code_number: '001' });
      setStoreImageFile(null);
      setStoreImagePreview('');
      fetchAdminData();
    } catch (err: any) {
      console.error('儲存店家失敗:', err);
      showToast(`❌ 儲存店家失敗: ${err?.message || '請稍後重試'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // 3. 刪除店家
  const handleDeleteStore = (storeId: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '⚠️ 刪除合作店家',
      message: '確定要刪除此店家嗎？此動作將一併影響相關菜單且無法復原！',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { error } = await supabase.from('stores').delete().eq('id', storeId);
          if (error) throw error;
          showToast('🗑️ 店家已刪除');
          fetchAdminData();
        } catch (err) {
          console.error('刪除店家失敗:', err);
          showToast('❌ 刪除店家失敗');
        }
      },
    });
  };

  // 4. 分類增修
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    try {
      if (editingCat) {
        const { error } = await supabase.from('categories').update({ name: catNameInput.trim() }).eq('id', editingCat.id);
        if (error) throw error;
        showToast('✅ 類別名稱已修改！');
      } else {
        const { error } = await supabase.from('categories').insert([{ name: catNameInput.trim(), sort_order: categories.length + 1 }]);
        if (error) throw error;
        showToast('➕ 已新增類別！');
      }
      setIsCatModalOpen(false);
      setEditingCat(null);
      setCatNameInput('');
      fetchAdminData();
    } catch (err) {
      console.error('儲存類別失敗:', err);
    }
  };

  const handleDeleteCategory = (catId: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '⚠️ 刪除商品分類',
      message: '確定要刪除此商品分類嗎？',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { error } = await supabase.from('categories').delete().eq('id', catId);
          if (error) throw error;
          showToast('🗑️ 類別已刪除');
          fetchAdminData();
        } catch (err) {
          console.error('刪除類別失敗:', err);
          showToast('❌ 刪除分類失敗');
        }
      },
    });
  };

  const handleMoveCategory = async (cat: Category, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === cat.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const targetCat = categories[targetIndex];
    await supabase.from('categories').update({ sort_order: targetCat.sort_order }).eq('id', cat.id);
    await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', targetCat.id);
    fetchAdminData();
  };

  // 5. 付款方式增修
  const handleCreatePaymentMethod = async () => {
    const payload = {
      name: `新付款方式 ${paymentMethods.length + 1}`,
      account_info: null,
      is_active: true,
    };
    const { error } = await supabase.from('payment_methods').insert([payload]);
    if (error) {
      showToast('❌ 新增付款方式失敗');
      return;
    }
    showToast('➕ 已新增付款方式');
    fetchAdminData();
  };

  const handleSavePaymentMethod = async (id: string, payload: { name: string; account_info: string | null }) => {
    const { error } = await supabase.from('payment_methods').update(payload).eq('id', id);
    if (error) {
      showToast('❌ 儲存付款方式失敗');
      return;
    }
    showToast('✅ 付款方式已更新');
    fetchAdminData();
  };

  const handleDeletePaymentMethod = (id: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '⚠️ 刪除付款方式',
      message: '確定要刪除此付款方式嗎？',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) {
          showToast('❌ 刪除付款方式失敗');
          return;
        }
        showToast('🗑️ 付款方式已刪除');
        fetchAdminData();
      },
    });
  };

  const handleTogglePaymentMethodActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('payment_methods').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      showToast('❌ 切換付款方式狀態失敗');
      return;
    }
    showToast(!currentStatus ? '✅ 已啟用付款方式' : '⏸️ 已停用付款方式');
    fetchAdminData();
  };

  // 6. 缺貨備案增修
  const handleCreateSoldOutOption = async () => {
    const nextOrder = soldOutOptions.length > 0 ? Math.max(...soldOutOptions.map((x) => x.sort_order)) + 1 : 1;
    const payload = { title: '請團長聯繫我', sort_order: nextOrder };
    const { error } = await supabase.from('sold_out_options').insert([payload]);
    if (error) {
      showToast('❌ 新增缺貨備案失敗');
      return;
    }
    showToast('➕ 已新增缺貨備案');
    fetchAdminData();
  };

  const handleSaveSoldOutOption = async (id: string, title: string) => {
    const { error } = await supabase.from('sold_out_options').update({ title: title.trim() }).eq('id', id);
    if (error) {
      showToast('❌ 儲存缺貨備案失敗');
      return;
    }
    showToast('✅ 缺貨備案已更新');
    fetchAdminData();
  };

  const handleDeleteSoldOutOption = (id: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '⚠️ 刪除缺貨備案',
      message: '確定要刪除此缺貨備案嗎？',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        const { error } = await supabase.from('sold_out_options').delete().eq('id', id);
        if (error) {
          showToast('❌ 刪除缺貨備案失敗');
          return;
        }
        showToast('🗑️ 缺貨備案已刪除');
        fetchAdminData();
      },
    });
  };

  const handleMoveSoldOutOption = async (id: string, direction: 'up' | 'down') => {
    const index = soldOutOptions.findIndex((o) => o.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= soldOutOptions.length) return;

    const currentOpt = soldOutOptions[index];
    const targetOpt = soldOutOptions[targetIndex];

    await supabase.from('sold_out_options').update({ sort_order: targetOpt.sort_order }).eq('id', currentOpt.id);
    await supabase.from('sold_out_options').update({ sort_order: currentOpt.sort_order }).eq('id', targetOpt.id);
    fetchAdminData();
  };

  // 7. 餐點規格群組操作
  const handleAddCustomGroup = () => {
    const newGroup: CustomGroup = {
      id: Date.now().toString(),
      title: '新客製化群組',
      type: 'single',
      options: [{ id: Date.now().toString() + '_1', name: '', price_adjustment: 0 }],
    };
    setProductCustomGroups([...productCustomGroups, newGroup]);
  };

  const handleRemoveCustomGroup = (groupId: string) => {
    setProductCustomGroups(productCustomGroups.filter((g) => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    setProductCustomGroups(
      productCustomGroups.map((g) =>
        g.id === groupId
          ? { ...g, options: [...g.options, { id: Date.now().toString(), name: '', price_adjustment: 0 }] }
          : g
      )
    );
  };

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setProductCustomGroups(
      productCustomGroups.map((g) =>
        g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g
      )
    );
  };

  // 8. 儲存餐點品項
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = selectedCrudStoreId || editingProduct?.store_id;
    if (!targetStoreId || !productForm.name.trim()) {
      showToast('⚠️ 請確認已選擇店家並填寫餐點名稱！');
      return;
    }
    try {
      const payload = {
        store_id: targetStoreId,
        name: productForm.name.trim(),
        price: parseFloat(productForm.price) || 0,
        description: productForm.description.trim() || null,
        stock_quantity: productForm.stock_quantity ? parseInt(productForm.stock_quantity) : null,
        is_sold_out: productForm.is_sold_out,
        custom_groups: productCustomGroups,
      };

      if (editingProduct) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        showToast('✅ 餐點與客製化選項已更新！');
      } else {
        const { error } = await supabase.from('menu_items').insert([payload]);
        if (error) throw error;
        showToast('🎉 新增餐點成功！');
      }
      setIsProductModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      console.error('儲存餐點失敗:', err);
      showToast(`❌ 儲存餐點失敗: ${err?.message || '請檢查格式'}`);
    }
  };

  // 9. 刪除餐點品項
  const handleDeleteProduct = (productId: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '⚠️ 刪除餐點品項',
      message: '確定要刪除此餐點品項嗎？此動作無法復原！',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { error } = await supabase.from('menu_items').delete().eq('id', productId);
          if (error) throw error;
          showToast('🗑️ 品項已刪除');
          fetchAdminData();
        } catch (err) {
          console.error('刪除品項失敗:', err);
          showToast('❌ 刪除品項失敗');
        }
      },
    });
  };

  // 10. 切換餐點售罄狀態
  const handleToggleProductStatus = async (productId: string) => {
    try {
      const item = allMenuItems.find((m) => m.id === productId);
      if (!item) return;
      const { error } = await supabase.from('menu_items').update({ is_sold_out: !item.is_sold_out }).eq('id', productId);
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      console.error('切換狀態失敗:', err);
    }
  };

  // 11. 重新排列菜單品項順序
  const handleReorderMenuItems = async (storeId: string, orderedItemIds: string[]) => {
    try {
      const res = await fetch('/api/menu/sort-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, itemIds: orderedItemIds }),
      });
      if (!res.ok) {
        throw new Error('伺服器儲存排序失敗');
      }
      showToast('✅ 菜單順序已更新！');
      fetchAdminData(undefined, true);
    } catch (err: any) {
      console.error('儲存菜單排序失敗:', err);
      showToast(`❌ 儲存順序失敗: ${err?.message || '未知錯誤'}`);
    }
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
  };
}
