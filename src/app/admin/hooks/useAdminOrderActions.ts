'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, OrderSubmissionAdmin, AdminConfirmModalState, AdminTabType } from '../admin-types';
import { useAdminArchiveActions } from './useAdminArchiveActions';
import { formatErrorMessage } from '@/lib/errorUtils';
import { recordPurgedOrderId } from '@/lib/cache/orderHistoryCache';
import { serializeOrderProgressStatus } from '@/types/orderStatus';
import type { DeleteOrderChoiceTarget } from '../components/modals/AdminDeleteOrderChoiceModal';
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
  allSubmissions,
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
  const [deleteChoiceTarget, setDeleteChoiceTarget] = useState<DeleteOrderChoiceTarget | null>(null);

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
  const handleSaveSignature = async (
    signatureData: string,
    overrideTarget?: OrderSubmissionAdmin | null
  ) => {
    const target = overrideTarget || signatureTarget;
    if (!target) {
      console.warn('儲存簽名失敗：缺少目標訂單');
      return;
    }
    const targetId = target.id;
    const targetNickname = target.user_nickname;
    if (setSignatureTarget) setSignatureTarget(null);

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
      showToast(`儲存簽名失敗：${formatErrorMessage(error, '資料庫存取異常')}`);
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
      showToast(`切換接單狀態失敗：${formatErrorMessage(err, '連線異常，請稍後再試')}`);
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

  // 🌟 執行訂單刪除與狀態映射核心函式
  const handleConfirmDeleteChoice = async (
    action: 'mark_completed' | 'mark_cancelled' | 'purge_everywhere',
    target: DeleteOrderChoiceTarget
  ) => {
    const targetIds = Array.isArray(target.id) ? target.id : [target.id];

    // 樂觀更新後台狀態
    setAllSubmissions((prev) => prev.filter((s) => !targetIds.includes(s.id)));
    setSelectedSubmissionIds((prev) => prev.filter((id) => !targetIds.includes(id)));

    if (action === 'purge_everywhere') {
      recordPurgedOrderId(targetIds);
      showToast(`已徹底抹除 ${targetIds.length} 筆訂單（前後台全數刪除）`);
    } else if (action === 'mark_completed') {
      showToast(`已自後台刪除訂單，前台顧客端顯示為【已完成】`);
    } else {
      showToast(`已自後台刪除訂單，前台顧客端顯示為【已取消】`);
    }

    try {
      // 1. 若非徹底抹除，先更新 signature_url 為指定狀態，確保前台顧客端能即時感知並持久化保存
      if (action !== 'purge_everywhere') {
        const finalStatus = action === 'mark_completed' ? 'completed' : 'cancelled';
        const payloadSignatureUrl = serializeOrderProgressStatus(finalStatus, '後台結單刪除');
        await supabase
          .from('order_submissions')
          .update({ signature_url: payloadSignatureUrl })
          .in('id', targetIds);
      } else {
        const payloadSignatureUrl = JSON.stringify({ status: 'purged', tombstone: 'purge_everywhere' });
        await supabase
          .from('order_submissions')
          .update({ signature_url: payloadSignatureUrl })
          .in('id', targetIds);
      }

      // 2. 從資料庫刪除
      await supabase.from('order_items').delete().in('submission_id', targetIds);
      const { error } = await supabase.from('order_submissions').delete().in('id', targetIds);
      if (error) throw error;
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    } catch (err: any) {
      console.error('刪除訂單失敗:', err);
      showToast(`刪除失敗：${formatErrorMessage(err, '資料庫存取異常')}`);
      fetchAdminData(selectedActiveGroupIdRef.current, true);
    }
  };

  // 9. 刪除單筆訂單（智慧狀態分流）
  const handleDeleteOrder = (subId: string, nickname: string, orderNumber: string) => {
    const targetSub = allSubmissions.find((s) => s.id === subId);
    const progressStatus = targetSub?.progress_status || 'pending';

    // 若訂單處於進行中狀態 (preparing 製作中 或 ready 待取餐)
    if (progressStatus === 'preparing' || progressStatus === 'ready') {
      setDeleteChoiceTarget({
        id: subId,
        orderNumber,
        nickname,
        currentStatus: progressStatus,
      });
      return;
    }

    // 若訂單已完成 (completed)
    if (progressStatus === 'completed') {
      openAdminConfirmModal({
        isOpen: true,
        title: '刪除已完成訂單',
        message: `確定要從後台刪除「${nickname}」的已完成訂單 #${orderNumber} 嗎？前台顧客端將保留紀錄並顯示為【已完成】。`,
        confirmText: '確定刪除',
        cancelText: '取消',
        isDanger: true,
        onConfirm: async () => {
          closeAdminConfirmModal();
          handleConfirmDeleteChoice('mark_completed', {
            id: subId,
            orderNumber,
            nickname,
            currentStatus: 'completed',
          });
        },
      });
      return;
    }

    // 若訂單為等待中 (pending) 或已取消 (cancelled)
    openAdminConfirmModal({
      isOpen: true,
      title: '刪除訂單',
      message: `確定要從後台刪除「${nickname}」的訂單 #${orderNumber} 嗎？前台顧客端將保留紀錄並顯示為【已取消】。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        handleConfirmDeleteChoice('mark_cancelled', {
          id: subId,
          orderNumber,
          nickname,
          currentStatus: progressStatus,
        });
      },
    });
  };

  // 10. 批次刪除訂單（智慧狀態分流）
  const handleBatchDeleteOrders = () => {
    if (!selectedSubmissionIds.length) return;
    const idsToDelete = [...selectedSubmissionIds];
    const count = idsToDelete.length;

    const selectedSubs = allSubmissions.filter((s) => idsToDelete.includes(s.id));
    const hasInProgress = selectedSubs.some(
      (s) => s.progress_status === 'preparing' || s.progress_status === 'ready'
    );

    // 若選取的訂單中有進行中的項目
    if (hasInProgress) {
      setDeleteChoiceTarget({
        id: idsToDelete,
        count,
        currentStatus: 'preparing',
      });
      return;
    }

    const allCompleted = selectedSubs.every((s) => s.progress_status === 'completed');
    const targetStatus = allCompleted ? 'mark_completed' : 'mark_cancelled';
    const statusLabel = allCompleted ? '已完成' : '已取消';

    openAdminConfirmModal({
      isOpen: true,
      title: '批次刪除訂單',
      message: `確定要批次刪除選取的 ${count} 筆訂單嗎？前台顧客端將保留紀錄並顯示為【${statusLabel}】。`,
      confirmText: '確定批次刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        handleConfirmDeleteChoice(targetStatus, {
          id: idsToDelete,
          count,
          currentStatus: allCompleted ? 'completed' : 'pending',
        });
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
    deleteChoiceTarget,
    setDeleteChoiceTarget,
    handleConfirmDeleteChoice,
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
