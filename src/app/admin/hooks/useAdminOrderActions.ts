'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, OrderSubmissionAdmin, AdminConfirmModalState, AdminTabType } from '../admin-types';
import { useAdminArchiveActions } from './useAdminArchiveActions';
import {
  copyPersonalReceipt,
  copyStoreOrderText,
  copyUnpaidReminder,
  exportOrdersCSV,
} from '../lib/adminOrderExport';

interface UseAdminOrderActionsProps {
  activeGroup: GroupOrderAdmin | null;
  setActiveGroup: (group: GroupOrderAdmin | null) => void;
  submissions: OrderSubmissionAdmin[];
  allSubmissions: OrderSubmissionAdmin[];
  setAllSubmissions: React.Dispatch<React.SetStateAction<OrderSubmissionAdmin[]>>;
  itemSummary: Record<string, number>;
  grandTotal: number;
  inputDeliveryFee: number;
  inputDiscount: number;
  roundingRule: 'floor' | 'ceil' | 'round';
  selectedActiveGroupIdRef: React.MutableRefObject<string>;
  fetchAdminData: (targetGroupId?: string, isSilent?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  openAdminConfirmModal: (modal: AdminConfirmModalState) => void;
  closeAdminConfirmModal: () => void;
  setActiveTab: (tab: AdminTabType) => void;
  signatureTarget?: OrderSubmissionAdmin | null;
  setSignatureTarget?: (target: OrderSubmissionAdmin | null) => void;
}

export function useAdminOrderActions({
  activeGroup,
  setActiveGroup,
  submissions,
  setAllSubmissions,
  itemSummary,
  grandTotal,
  inputDeliveryFee,
  inputDiscount,
  roundingRule,
  selectedActiveGroupIdRef,
  fetchAdminData,
  showToast,
  openAdminConfirmModal,
  closeAdminConfirmModal,
  setActiveTab,
  signatureTarget: externalSignatureTarget,
  setSignatureTarget: externalSetSignatureTarget,
}: UseAdminOrderActionsProps) {
  // Modal 狀態
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState<boolean>(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState<boolean>(false);

  const [internalSignatureTarget, setInternalSignatureTarget] = useState<OrderSubmissionAdmin | null>(null);
  const signatureTarget = externalSignatureTarget !== undefined ? externalSignatureTarget : internalSignatureTarget;
  const setSignatureTarget = externalSetSignatureTarget || setInternalSignatureTarget;

  const [changeModalTarget, setChangeModalTarget] = useState<{ nickname: string; amount: number } | null>(null);
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);

  // 1. 歷史歸檔子模組 Hook
  const {
    selectedArchivedGroupId,
    setSelectedArchivedGroupId,
    handleArchiveGroup,
    handleReopenGroup,
    handleDeleteArchivedGroup,
    handleBatchDeleteArchivedGroups,
  } = useAdminArchiveActions({
    activeGroup,
    fetchAdminData,
    showToast,
    openAdminConfirmModal,
    closeAdminConfirmModal,
    setActiveTab,
  });

  // 2. 試算平攤金額
  const calculateAdjustedAmount = (baseAmount: number) => {
    if (!submissions.length) return baseAmount;
    const netAdjustment = inputDeliveryFee - inputDiscount;
    const perPersonShare = netAdjustment / submissions.length;

    let roundedShare = 0;
    if (roundingRule === 'floor') roundedShare = Math.floor(perPersonShare);
    else if (roundingRule === 'ceil') roundedShare = Math.ceil(perPersonShare);
    else roundedShare = Math.round(perPersonShare);

    return Math.max(0, baseAmount + roundedShare);
  };

  // 3. 套用外送費與折扣平攤
  const handleApplyFeeSplit = async () => {
    if (!activeGroup || submissions.length === 0) return;

    for (const sub of submissions) {
      const adjustedFinal = calculateAdjustedAmount(sub.total_amount);
      await supabase.from('order_submissions').update({ final_amount: adjustedFinal }).eq('id', sub.id);
    }

    await supabase
      .from('group_orders')
      .update({
        delivery_fee: inputDeliveryFee,
        discount_amount: inputDiscount,
        rounding_rule: roundingRule,
      })
      .eq('id', activeGroup.id);

    showToast(`平攤設定已更新！已重新試算全團個人金額。`);
    fetchAdminData();
  };

  // 4. 儲存對帳簽名
  const handleSaveSignature = async (signatureData: string) => {
    if (!signatureTarget) return;
    const targetId = signatureTarget.id;
    const targetNickname = signatureTarget.user_nickname;
    setSignatureTarget(null);

    setAllSubmissions((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, signature_data: signatureData, is_paid: true } : s))
    );
    showToast(`已成功儲存 ${targetNickname} 的對帳簽名！`);

    const { error } = await supabase
      .from('order_submissions')
      .update({ signature_data: signatureData, is_paid: true })
      .eq('id', targetId);

    if (error) {
      console.error('儲存簽名失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    }
  };

  // 5. 儲存團購活動設定
  const handleSaveGroupSettings = async (updatedData: {
    title: string;
    store_id: string;
    announcement: string | null;
    enable_min_threshold: boolean;
    min_threshold_amount: number;
    enable_countdown: boolean;
    cutoff_time: string | null;
    enable_budget_limit: boolean;
    budget_limit_amount: number;
  }) => {
    if (activeGroup) {
      const { error } = await supabase.from('group_orders').update(updatedData).eq('id', activeGroup.id);
      if (error) throw error;

      // 同步更新 stores 表
      await supabase
        .from('stores')
        .update({
          announcement: updatedData.announcement,
          enable_min_threshold: updatedData.enable_min_threshold,
          min_threshold_amount: updatedData.min_threshold_amount,
          enable_countdown: updatedData.enable_countdown,
          cutoff_time: updatedData.cutoff_time,
          enable_budget_limit: updatedData.enable_budget_limit,
          budget_limit_amount: updatedData.budget_limit_amount,
        })
        .eq('id', updatedData.store_id || activeGroup.store_id || activeGroup.id);

      showToast('店家即時營運設定與公告已成功儲存！');
    } else {
      const { error } = await supabase.from('group_orders').insert([{ ...updatedData, status: 'open' }]);
      if (error) throw error;
      showToast('新店家營運活動已成功開啟！');
    }
    fetchAdminData();
  };

  // 6. 切換店家接單狀態
  const handleToggleGroupStatus = async (newStatus: 'open' | 'closed') => {
    if (!activeGroup) return;

    const storeTargetId = activeGroup.store_id || activeGroup.id;
    try {
      if (storeTargetId) {
        // 1. 更新 stores 表
        await supabase
          .from('stores')
          .update({ is_accepting_orders: newStatus === 'open' })
          .eq('id', storeTargetId);

        // 2. 同步更新該店家所有未歸檔的 group_orders
        await supabase
          .from('group_orders')
          .update({ status: newStatus })
          .eq('store_id', storeTargetId)
          .neq('status', 'completed');
      }

      setActiveGroup({ ...activeGroup, status: newStatus });
      showToast(`店家接單狀態已切換為：${newStatus === 'closed' ? '⏸️ 暫停接單中' : '🟢 開放接單中'}`);
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    } catch (err: any) {
      console.error('切換店家接單狀態失敗:', err);
      showToast(`切換接單狀態失敗：${err?.message || err}`);
    }
  };

  // 7. 切換單一訂單付款狀態
  const handleTogglePaid = async (subId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    setAllSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, is_paid: newStatus } : s)));
    showToast(newStatus ? '標記為已付款' : '標記為未付款');

    const { error } = await supabase.from('order_submissions').update({ is_paid: newStatus }).eq('id', subId);

    if (error) {
      console.error('更新付款狀態失敗:', error);
      setAllSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, is_paid: currentStatus } : s)));
      showToast('更新付款狀態失敗，已復原狀態');
    }
  };

  // 8. 批次標記已付款
  const handleBatchMarkPaid = async () => {
    if (!selectedSubmissionIds.length) return;
    const idsToUpdate = [...selectedSubmissionIds];
    setSelectedSubmissionIds([]);

    setAllSubmissions((prev) => prev.map((s) => (idsToUpdate.includes(s.id) ? { ...s, is_paid: true } : s)));
    showToast(`已批次標記 ${idsToUpdate.length} 筆訂單為已付款！`);

    const { error } = await supabase.from('order_submissions').update({ is_paid: true }).in('id', idsToUpdate);

    if (error) {
      console.error('批次標記失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current);
      showToast('批次更新付款狀態失敗');
    }
  };

  // 🌟 8.5 更新訂單進度狀態 (待確認、備餐中、待取餐、已完成、已取消)
  const handleUpdateProgressStatus = async (
    subId: string,
    newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled',
    note?: string
  ) => {
    const payloadSignatureUrl = JSON.stringify({
      status: newStatus,
      note: note || '',
      updated_at: new Date().toISOString(),
    });

    const labelMap: Record<string, string> = {
      pending: '待確認',
      preparing: '製作中',
      ready: '待取餐',
      completed: '已完成',
      cancelled: '已取消',
    };

    setAllSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId ? { ...s, progress_status: newStatus, signature_url: payloadSignatureUrl } : s
      )
    );

    showToast(`訂單狀態已更新為「${labelMap[newStatus] || newStatus}」！`);

    const { error } = await supabase
      .from('order_submissions')
      .update({ signature_url: payloadSignatureUrl })
      .eq('id', subId);

    if (error) {
      console.error('更新訂單進度狀態失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current, true);
      showToast('更新訂單進度失敗，請檢查網路');
    }
  };

  // 🌟 8.6 批次變更訂單進度狀態
  const handleBatchUpdateProgressStatus = async (
    newStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  ) => {
    if (!selectedSubmissionIds.length) return;
    const idsToUpdate = [...selectedSubmissionIds];
    setSelectedSubmissionIds([]);

    const payloadSignatureUrl = JSON.stringify({
      status: newStatus,
      note: '',
      updated_at: new Date().toISOString(),
    });

    const labelMap: Record<string, string> = {
      pending: '待確認',
      preparing: '製作中',
      ready: '待取餐',
      completed: '已完成',
      cancelled: '已取消',
    };

    setAllSubmissions((prev) =>
      prev.map((s) =>
        idsToUpdate.includes(s.id)
          ? { ...s, progress_status: newStatus, signature_url: payloadSignatureUrl }
          : s
      )
    );

    showToast(`已批次將 ${idsToUpdate.length} 筆訂單標記為「${labelMap[newStatus] || newStatus}」！`);

    const { error } = await supabase
      .from('order_submissions')
      .update({ signature_url: payloadSignatureUrl })
      .in('id', idsToUpdate);

    if (error) {
      console.error('批次更新訂單進度失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current, true);
      showToast('批次更新進度失敗');
    }
  };

  // 9. 刪除單筆訂單
  const handleDeleteOrder = (subId: string, nickname: string, orderNumber: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除訂單',
      message: `確定要刪除「${nickname}」的訂單 #${orderNumber} 嗎？此動作將一併刪除該訂單的所有餐點明細，且無法復原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        setAllSubmissions((prev) => prev.filter((s) => s.id !== subId));
        setSelectedSubmissionIds((prev) => prev.filter((id) => id !== subId));
        showToast(`已刪除 ${nickname} 的訂單`);

        try {
          await supabase.from('order_items').delete().eq('submission_id', subId);
          const { error } = await supabase.from('order_submissions').delete().eq('id', subId);
          if (error) throw error;
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        } catch (err) {
          console.error('刪除訂單失敗:', err);
          showToast('刪除訂單失敗，正在重新同步...');
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      },
    });
  };

  // 10. 批次刪除訂單
  const handleBatchDeleteOrders = () => {
    if (!selectedSubmissionIds.length) return;
    const idsToDelete = [...selectedSubmissionIds];
    const count = idsToDelete.length;

    openAdminConfirmModal({
      isOpen: true,
      title: '批次刪除訂單',
      message: `確定要批次刪除選取的 ${count} 筆訂單嗎？此動作將一併刪除這些訂單的所有餐點明細，且無法復原。`,
      confirmText: '確定批次刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        setAllSubmissions((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
        setSelectedSubmissionIds([]);
        showToast(`已批次刪除 ${count} 筆訂單`);

        try {
          await supabase.from('order_items').delete().in('submission_id', idsToDelete);
          const { error } = await supabase.from('order_submissions').delete().in('id', idsToDelete);
          if (error) throw error;
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        } catch (err) {
          console.error('批次刪除訂單失敗:', err);
          showToast('批次刪除失敗，正在重新同步...');
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      },
    });
  };

  return {
    isPrintModalOpen,
    setIsPrintModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isBatchImportModalOpen,
    setIsBatchImportModalOpen,
    isGroupSettingsModalOpen,
    setIsGroupSettingsModalOpen,
    signatureTarget,
    setSignatureTarget,
    changeModalTarget,
    setChangeModalTarget,
    receivedCash,
    setReceivedCash,
    selectedSubmissionIds,
    setSelectedSubmissionIds,
    selectedArchivedGroupId,
    setSelectedArchivedGroupId,
    calculateAdjustedAmount,
    handleApplyFeeSplit,
    handleSaveSignature,
    handleArchiveGroup,
    handleReopenGroup,
    handleDeleteArchivedGroup,
    handleBatchDeleteArchivedGroups,
    handleSaveGroupSettings,
    handleToggleGroupStatus,
    handleTogglePaid,
    handleBatchMarkPaid,
    handleUpdateProgressStatus,
    handleBatchUpdateProgressStatus,
    handleDeleteOrder,
    handleBatchDeleteOrders,
    handleCopyPersonalReceipt: (sub: OrderSubmissionAdmin) => copyPersonalReceipt(sub, showToast),
    handleCopyStoreOrderText: () => copyStoreOrderText(activeGroup, itemSummary, grandTotal, showToast),
    handleCopyUnpaidReminder: () => copyUnpaidReminder(activeGroup, submissions, showToast),
    handleExportOrdersCSV: () => exportOrdersCSV(activeGroup, submissions, showToast),
  };
}
