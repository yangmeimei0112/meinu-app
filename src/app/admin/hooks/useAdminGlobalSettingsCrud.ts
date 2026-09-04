'use client';

import { supabase } from '@/lib/supabase';
import { Category, PaymentMethod, SoldOutOption } from '@/types/database';
import { AdminConfirmModalState } from '../admin-types';
import { formatErrorMessage } from '@/lib/errorUtils';

interface UseAdminGlobalSettingsCrudProps {
  categories: Category[];
  paymentMethods?: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
}

export function useAdminGlobalSettingsCrud({
  categories,
  soldOutOptions,
  fetchAdminData,
  showToast,
  openAdminConfirmModal,
  closeAdminConfirmModal,
}: UseAdminGlobalSettingsCrudProps) {
  // 1. 移動分類順序
  const handleMoveCategory = async (category: Category, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = sorted.findIndex((c) => c.id === category.id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const targetCat = sorted[swapIdx];

    const currentSort = category.sort_order || 1;
    const targetSort = targetCat.sort_order || 1;

    await supabase.from('categories').update({ sort_order: targetSort }).eq('id', category.id);
    await supabase.from('categories').update({ sort_order: currentSort }).eq('id', targetCat.id);

    fetchAdminData();
  };

  // 2. 付款方式 CRUD
  const handleCreatePaymentMethod = async () => {
    const { error } = await supabase
      .from('payment_methods')
      .insert([{ name: '新付款方式', account_info: '', is_active: true }]);
    if (error) {
      showToast(formatErrorMessage(error, '新增付款方式失敗，請稍後再試！'));
      return;
    }
    showToast('已新增付款方式');
    fetchAdminData();
  };

  const handleSavePaymentMethod = async (id: string, payload: { name: string; account_info: string | null }) => {
    const { error } = await supabase.from('payment_methods').update(payload).eq('id', id);
    if (error) {
      showToast(formatErrorMessage(error, '儲存付款方式失敗，請稍後再試！'));
      return;
    }
    showToast('付款方式已儲存');
    fetchAdminData();
  };

  const handleDeletePaymentMethod = (id: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除付款方式',
      message: '確定要刪除此付款方式嗎？',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) {
          showToast(formatErrorMessage(error, '刪除付款方式失敗，請確認無關聯訂單！'));
          return;
        }
        showToast('已刪除付款方式');
        fetchAdminData();
      },
    });
  };

  const handleTogglePaymentMethodActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    if (error) {
      showToast(formatErrorMessage(error, '更新付款方式狀態失敗，請稍後再試！'));
      return;
    }
    showToast(!currentStatus ? '已啟用付款方式' : '已停用付款方式');
    fetchAdminData();
  };

  // 3. 缺貨備案 CRUD
  const handleCreateSoldOutOption = async () => {
    const nextOrder = soldOutOptions.length > 0 ? Math.max(...soldOutOptions.map((o) => o.sort_order || 0)) + 1 : 1;
    const { error } = await supabase
      .from('sold_out_options')
      .insert([{ title: '新備案選項', sort_order: nextOrder }]);
    if (error) {
      showToast(formatErrorMessage(error, '新增缺貨備案失敗，請稍後再試！'));
      return;
    }
    showToast('已新增缺貨備案');
    fetchAdminData();
  };

  const handleSaveSoldOutOption = async (id: string, title: string) => {
    const { error } = await supabase.from('sold_out_options').update({ title }).eq('id', id);
    if (error) {
      showToast(formatErrorMessage(error, '儲存缺貨備案失敗，請稍後再試！'));
      return;
    }
    showToast('缺貨備案已儲存');
    fetchAdminData();
  };

  const handleDeleteSoldOutOption = (id: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除缺貨備案',
      message: '確定要刪除此缺貨備案選項嗎？',
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        const { error } = await supabase.from('sold_out_options').delete().eq('id', id);
        if (error) {
          showToast(formatErrorMessage(error, '刪除缺貨備案失敗，請確認無關聯資料！'));
          return;
        }
        showToast('已刪除缺貨備案');
        fetchAdminData();
      },
    });
  };

  const handleMoveSoldOutOption = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...soldOutOptions].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = sorted.findIndex((o) => o.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const currentOpt = sorted[idx];
    const targetOpt = sorted[swapIdx];

    await supabase.from('sold_out_options').update({ sort_order: targetOpt.sort_order }).eq('id', currentOpt.id);
    await supabase.from('sold_out_options').update({ sort_order: currentOpt.sort_order }).eq('id', targetOpt.id);

    fetchAdminData();
  };

  return {
    handleMoveCategory,
    handleCreatePaymentMethod,
    handleSavePaymentMethod,
    handleDeletePaymentMethod,
    handleTogglePaymentMethodActive,
    onCreateSoldOutOption: handleCreateSoldOutOption,
    onSaveSoldOutOption: handleSaveSoldOutOption,
    onDeleteSoldOutOption: handleDeleteSoldOutOption,
    onMoveSoldOutOption: handleMoveSoldOutOption,
  };
}
