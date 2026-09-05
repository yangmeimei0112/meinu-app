'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, AdminConfirmModalState, AdminTabType } from '../admin-types';
import { formatErrorMessage } from '@/lib/errorUtils';

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

  // 1. 結案歸檔目前店家之即時訂單
  const handleArchiveGroup = () => {
    if (!activeGroup) return;

    const storeId = activeGroup.store_id || activeGroup.id;
    const storeName = activeGroup.stores?.name || activeGroup.title;

    openAdminConfirmModal({
      isOpen: true,
      title: `確定歸檔「${storeName}」訂單？`,
      message: `確定要將「${storeName}」目前的即時訂單全部結算歸檔嗎？歸檔後此店之即時訂單將移入歷史庫並清空列表，店家可隨時展開下一輪收單。`,
      confirmText: '確定歸檔',
      cancelText: '取消',
      isDanger: false,
      onConfirm: async () => {
        closeAdminConfirmModal();
        try {
          const trueGroupId = activeGroup.id;

          // 1. 將該團購活動設為 completed (結案歸檔)
          const { data: updatedGroup, error: updateErr } = await supabase
            .from('group_orders')
            .update({ status: 'completed' })
            .eq('id', trueGroupId)
            .select();

          if (updateErr) throw updateErr;

          // 若以 id 更新未命中（例如之前 activeGroup.id 曾為 store.id），則以 store_id 更新未結案者
          if (!updatedGroup || updatedGroup.length === 0) {
            await supabase
              .from('group_orders')
              .update({ status: 'completed' })
              .eq('store_id', storeId)
              .neq('status', 'completed');
          }

          // 2. 嘗試非阻塞式寫入結案批次審計紀錄 (若資料庫有建立該選用表)
          try {
            const { data: subList } = await supabase
              .from('order_submissions')
              .select('id, final_amount, total_amount')
              .or(`group_order_id.eq.${trueGroupId},group_order_id.eq.${storeId}`);

            const subIds = subList ? subList.map((s) => s.id) : [];
            if (subIds.length > 0) {
              const batchNum = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
              const totalAmount = subList?.reduce((sum, s) => sum + (s.final_amount || s.total_amount || 0), 0) || 0;

              await supabase.from('store_order_batches').insert([
                {
                  store_id: storeId,
                  store_name: storeName,
                  batch_number: batchNum,
                  total_submissions: subIds.length,
                  total_items_count: 0,
                  total_amount: totalAmount,
                  delivery_fee: activeGroup.delivery_fee || 0,
                  discount_amount: activeGroup.discount_amount || 0,
                  final_amount: totalAmount,
                  archived_at: new Date().toISOString(),
                },
              ]);
            }
          } catch {}

          showToast(`「${storeName}」訂單已成功批次歸檔！`);
          await fetchAdminData('all');
          setActiveTab('archive');
        } catch (err: any) {
          console.error('結案歸檔失敗:', err);
          showToast(`結案歸檔失敗：${formatErrorMessage(err, '資料庫存取異常')}`);
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
          const targetStoreId = group.store_id || group.id;
          const newTitle = group.title.includes('(新開)') ? group.title : `${group.title} (新開)`;

          const { data, error } = await supabase
            .from('group_orders')
            .insert([
              {
                store_id: targetStoreId,
                title: newTitle,
                status: 'open',
                announcement: group.announcement || null,
                delivery_fee: group.delivery_fee || 0,
                discount_amount: group.discount_amount || 0,
                rounding_rule: group.rounding_rule || 'floor',
                enable_min_threshold: group.enable_min_threshold ?? false,
                min_threshold_amount: group.min_threshold_amount || 0,
                enable_countdown: group.enable_countdown ?? false,
                cutoff_time: group.cutoff_time || null,
                enable_budget_limit: group.enable_budget_limit ?? false,
                budget_limit_amount: group.budget_limit_amount || 0,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          // 同步確保店家處於開放接單狀態
          if (targetStoreId) {
            await supabase
              .from('stores')
              .update({ is_accepting_orders: true })
              .eq('id', targetStoreId);
          }

          showToast(`已成功重新發起團購活動！`);
          await fetchAdminData(data.id);
          setActiveTab('active');
        } catch (err: any) {
          console.error('重開團購活動失敗:', err);
          showToast(`發起失敗：${formatErrorMessage(err, '新增活動失敗')}`);
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
          showToast(`刪除失敗：${formatErrorMessage(err, '刪除歷史紀錄異常')}`);
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
          showToast(`批次刪除失敗：${formatErrorMessage(err, '批次刪除歷史紀錄異常')}`);
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
