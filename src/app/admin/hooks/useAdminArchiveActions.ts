'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, AdminConfirmModalState, AdminTabType } from '../admin-types';

interface UseAdminArchiveActionsProps {
  activeGroup: GroupOrderAdmin | null;
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
  setActiveTab: (tab: AdminTabType) => void;
}

export function useAdminArchiveActions({
  activeGroup,
  fetchAdminData,
  showToast,
  openAdminConfirmModal,
  closeAdminConfirmModal,
  setActiveTab,
}: UseAdminArchiveActionsProps) {
  const [selectedArchivedGroupId, setSelectedArchivedGroupId] = useState<string | null>(null);

  // 1. 結案歸檔目前進行中活動
  const handleArchiveGroup = () => {
    if (!activeGroup) return;

    openAdminConfirmModal({
      isOpen: true,
      title: '確定結案歸檔？',
      message: `確定要將「${activeGroup.title}」結案歸檔嗎？歸檔後此活動將移至「歷史活動」分頁，前台將停止接收此活動的訂單。`,
      confirmText: '確定歸檔',
      cancelText: '取消',
      isDanger: false,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { error } = await supabase
            .from('group_orders')
            .update({ status: 'completed' })
            .eq('id', activeGroup.id);

          if (error) throw error;

          showToast(`「${activeGroup.title}」已成功結案歸檔！`);
          fetchAdminData();
          setActiveTab('archive');
        } catch (err: any) {
          console.error('結案歸檔失敗:', err);
          showToast(`結案歸檔失敗：${err?.message || err}`);
        }
      },
    });
  };

  // 2. 複製重開歷史活動
  const handleReopenGroup = (group: GroupOrderAdmin) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '以此活動發起新團購',
      message: `確定要以「${group.title}」為範本重新發起新團購嗎？這將會建立一筆新的「開放中」團購活動，並保留相同店家與設定。`,
      confirmText: '確定發起新團',
      cancelText: '取消',
      isDanger: false,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { data, error } = await supabase
            .from('group_orders')
            .insert([
              {
                store_id: group.store_id,
                title: `${group.title} (新開)`,
                status: 'open',
                announcement: group.announcement,
                delivery_fee: group.delivery_fee,
                discount_amount: group.discount_amount,
                rounding_rule: group.rounding_rule,
                enable_min_threshold: group.enable_min_threshold,
                min_threshold_amount: group.min_threshold_amount,
                enable_countdown: group.enable_countdown,
                cutoff_time: group.cutoff_time,
                enable_budget_limit: group.enable_budget_limit,
                budget_limit_amount: group.budget_limit_amount,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          showToast(`已成功重新發起團購活動！`);
          fetchAdminData(data.id);
          setActiveTab('active');
        } catch (err: any) {
          console.error('重開團購活動失敗:', err);
          showToast(`發起失敗：${err?.message || err}`);
        }
      },
    });
  };

  // 3. 刪除單一歷史活動
  const handleDeleteArchivedGroup = (groupId: string, title: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除歷史活動',
      message: `確定要刪除歷史活動「${title}」嗎？此動作將一併清除該活動底下的所有歷史訂單紀錄，且無法復原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { data: subs } = await supabase
            .from('order_submissions')
            .select('id')
            .eq('group_order_id', groupId);

          if (subs && subs.length > 0) {
            const subIds = subs.map((s) => s.id);
            await supabase.from('order_items').delete().in('submission_id', subIds);
            await supabase.from('order_submissions').delete().in('id', subIds);
          }

          const { error } = await supabase.from('group_orders').delete().eq('id', groupId);
          if (error) throw error;

          showToast(`歷史活動「${title}」已刪除`);
          fetchAdminData();
        } catch (err: any) {
          console.error('刪除歷史活動失敗:', err);
          showToast(`刪除失敗：${err?.message || err}`);
        }
      },
    });
  };

  // 4. 批次刪除歷史活動
  const handleBatchDeleteArchivedGroups = (groupIds: string[]) => {
    if (!groupIds.length) return;
    const count = groupIds.length;

    openAdminConfirmModal({
      isOpen: true,
      title: '批次刪除歷史活動',
      message: `確定要批次刪除選取的 ${count} 個歷史活動嗎？此動作將一併清除這些活動底下的所有歷史訂單紀錄，且無法復原。`,
      confirmText: '確定批次刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const { data: subs } = await supabase
            .from('order_submissions')
            .select('id')
            .in('group_order_id', groupIds);

          if (subs && subs.length > 0) {
            const subIds = subs.map((s) => s.id);
            await supabase.from('order_items').delete().in('submission_id', subIds);
            await supabase.from('order_submissions').delete().in('id', subIds);
          }

          const { error } = await supabase.from('group_orders').delete().in('id', groupIds);
          if (error) throw error;

          showToast(`已批次刪除 ${count} 個歷史活動`);
          fetchAdminData();
        } catch (err: any) {
          console.error('批次刪除歷史活動失敗:', err);
          showToast(`批次刪除失敗：${err?.message || err}`);
        }
      },
    });
  };

  return {
    selectedArchivedGroupId,
    setSelectedArchivedGroupId,
    handleArchiveGroup,
    handleReopenGroup,
    handleDeleteArchivedGroup,
    handleBatchDeleteArchivedGroups,
  };
}
