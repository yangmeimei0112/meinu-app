'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { AdminConfirmModalState } from '../admin-types';
import { formatErrorMessage } from '@/lib/errorUtils';

interface UseAdminCategoryCrudProps {
  categories: Category[];
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
}

export function useAdminCategoryCrud({
  categories,
  fetchAdminData,
  showToast,
  openAdminConfirmModal,
  closeAdminConfirmModal,
}: UseAdminCategoryCrudProps) {
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState<string>('');

  const openCreateCategoryModal = () => {
    setEditingCat(null);
    setCatNameInput('');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCat(cat);
    setCatNameInput(cat.name);
    setIsCatModalOpen(true);
  };

  // 儲存分類
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    if (editingCat) {
      const { error } = await supabase
        .from('categories')
        .update({ name: catNameInput.trim() })
        .eq('id', editingCat.id);

      if (error) {
        console.error('更新分類失敗:', error);
        showToast('更新分類失敗');
        return;
      }
      showToast('分類已更新！');
    } else {
      const nextSortOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order || 0)) + 1 : 1;
      const { error } = await supabase
        .from('categories')
        .insert([{ name: catNameInput.trim(), sort_order: nextSortOrder }]);

      if (error) {
        console.error('新增分類失敗:', error);
        showToast('新增分類失敗');
        return;
      }
      showToast('分類新增成功！');
    }

    setIsCatModalOpen(false);
    fetchAdminData();
  };

  // 刪除分類
  const handleDeleteCategory = (catId: string, name: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除分類',
      message: `確定要刪除「${name}」分類嗎？屬於此分類的店家將轉為「未分類」，此動作無法復原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          await supabase.from('stores').update({ category_id: null }).eq('category_id', catId);
          const { error } = await supabase.from('categories').delete().eq('id', catId);
          if (error) throw error;
          showToast(`已刪除分類「${name}」`);
          fetchAdminData();
        } catch (err: any) {
          console.error('刪除分類失敗:', err);
          showToast(`刪除分類失敗：${formatErrorMessage(err, '資料庫關聯異常')}`);
        }
      },
    });
  };

  // 分類拖曳重排
  const handleReorderCategories = async (newOrderedCategories: Category[]) => {
    try {
      const updates = newOrderedCategories.map((c, index) => ({
        id: c.id,
        name: c.name,
        sort_order: index + 1,
      }));

      for (const cat of updates) {
        await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', cat.id);
      }

      showToast('分類排序已更新！');
      fetchAdminData();
    } catch (err) {
      console.error('分類排序更新失敗:', err);
      showToast('排序更新失敗');
    }
  };

  return {
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
  };
}
