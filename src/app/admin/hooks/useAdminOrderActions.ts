'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, OrderSubmissionAdmin, AdminConfirmModalState, AdminTabType } from '../admin-types';

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
}: UseAdminOrderActionsProps) {
  // Modal 狀態
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState<boolean>(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState<boolean>(false);

  const [signatureTarget, setSignatureTarget] = useState<OrderSubmissionAdmin | null>(null);
  const [changeModalTarget, setChangeModalTarget] = useState<{ nickname: string; amount: number } | null>(null);
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [selectedArchivedGroupId, setSelectedArchivedGroupId] = useState<string | null>(null);

  // 1. 試算平攤金額
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

  // 2. 套用外送費與折扣平攤
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

    showToast(`🔢 平攤設定已更新！已重新試算全團個人金額。`);
    fetchAdminData();
  };

  // 3. 儲存對帳簽名
  const handleSaveSignature = async (signatureData: string) => {
    if (!signatureTarget) return;
    const targetId = signatureTarget.id;
    const targetNickname = signatureTarget.user_nickname;
    setSignatureTarget(null);

    setAllSubmissions((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, signature_data: signatureData, is_paid: true } : s))
    );
    showToast(`✍️ 已存入 ${targetNickname} 的對帳手繪簽名！`);

    const { error } = await supabase
      .from('order_submissions')
      .update({ signature_data: signatureData, is_paid: true })
      .eq('id', targetId);

    if (error) {
      console.error('儲存簽名失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current);
      showToast('❌ 儲存簽名失敗');
    }
  };

  // 4. 歸檔進行中團購
  const handleArchiveGroup = () => {
    if (!activeGroup) return;
    openAdminConfirmModal({
      isOpen: true,
      title: '📦 歸檔團購活動',
      message: '確定要歸檔此團購活動嗎？歸檔後可隨時一鍵重開新團。',
      confirmText: '確定歸檔',
      cancelText: '取消',
      isDanger: false,
      onConfirm: async () => {
        closeAdminConfirmModal();
        await supabase.from('group_orders').update({ status: 'completed' }).eq('id', activeGroup.id);
        showToast('📦 團購活動已移入歷史歸檔！');
        fetchAdminData();
      },
    });
  };

  // 5. 重開歷史活動
  const handleReopenGroup = async (group: GroupOrderAdmin) => {
    const { data: newGroup, error } = await supabase
      .from('group_orders')
      .insert({
        title: `${group.title} (新開團)`,
        store_id: group.store_id,
        status: 'open',
        announcement: group.announcement,
        delivery_fee: group.delivery_fee,
        discount_amount: group.discount_amount,
        rounding_rule: group.rounding_rule,
        enable_min_threshold: group.enable_min_threshold,
        min_threshold_amount: group.min_threshold_amount,
        enable_countdown: group.enable_countdown,
        enable_budget_limit: group.enable_budget_limit,
        budget_limit_amount: group.budget_limit_amount,
      })
      .select('*')
      .single();

    if (!error && newGroup) {
      showToast('🔄 已成功一鍵發起新團購活動！');
      setActiveTab('active');
      fetchAdminData();
    } else {
      showToast('❌ 建立新團購活動失敗');
    }
  };

  // 6. 刪除單一歷史活動
  const handleDeleteArchivedGroup = (groupId: string, title: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '🗑️ 刪除歷史活動',
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

          showToast(`🗑️ 已刪除歷史活動「${title}」`);
          fetchAdminData();
        } catch (err: any) {
          console.error('刪除歷史活動失敗:', err);
          showToast(`❌ 刪除失敗：${err?.message || err}`);
        }
      },
    });
  };

  // 7. 批次刪除歷史活動
  const handleBatchDeleteArchivedGroups = (groupIds: string[]) => {
    if (!groupIds.length) return;
    const count = groupIds.length;

    openAdminConfirmModal({
      isOpen: true,
      title: '🗑️ 批次刪除歷史活動',
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

          showToast(`🗑️ 已批次刪除 ${count} 個歷史活動`);
          fetchAdminData();
        } catch (err: any) {
          console.error('批次刪除歷史活動失敗:', err);
          showToast(`❌ 批次刪除失敗：${err?.message || err}`);
        }
      },
    });
  };

  // 8. 儲存團購活動設定
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
      showToast('✅ 團購活動設定與公告已更新！');
    } else {
      const { error } = await supabase.from('group_orders').insert([{ ...updatedData, status: 'open' }]);
      if (error) throw error;
      showToast('🎉 新團購活動已成功發起！');
    }
    fetchAdminData();
  };

  // 9. 切換活動收單狀態
  const handleToggleGroupStatus = async (newStatus: 'open' | 'closed') => {
    if (!activeGroup) return;
    const { error } = await supabase.from('group_orders').update({ status: newStatus }).eq('id', activeGroup.id);

    if (!error) {
      setActiveGroup({ ...activeGroup, status: newStatus });
      showToast(`活動已切換為：${newStatus === 'closed' ? '🔒 已截單 (停止收單)' : '🟢 開放收單中'}`);
    }
  };

  // 10. 切換單一訂單付款狀態
  const handleTogglePaid = async (subId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    setAllSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, is_paid: newStatus } : s)));
    showToast(newStatus ? '✅ 標記為已付款' : '⏳ 標記為未付款');

    const { error } = await supabase.from('order_submissions').update({ is_paid: newStatus }).eq('id', subId);

    if (error) {
      console.error('更新付款狀態失敗:', error);
      setAllSubmissions((prev) => prev.map((s) => (s.id === subId ? { ...s, is_paid: currentStatus } : s)));
      showToast('❌ 更新付款狀態失敗，已復原狀態');
    }
  };

  // 11. 批次標記已付款
  const handleBatchMarkPaid = async () => {
    if (!selectedSubmissionIds.length) return;
    const idsToUpdate = [...selectedSubmissionIds];
    setSelectedSubmissionIds([]);

    setAllSubmissions((prev) => prev.map((s) => (idsToUpdate.includes(s.id) ? { ...s, is_paid: true } : s)));
    showToast(`✅ 已批次標記 ${idsToUpdate.length} 筆訂單為已付款！`);

    const { error } = await supabase.from('order_submissions').update({ is_paid: true }).in('id', idsToUpdate);

    if (error) {
      console.error('批次標記失敗:', error);
      fetchAdminData(selectedActiveGroupIdRef.current);
      showToast('❌ 批次更新付款狀態失敗');
    }
  };

  // 12. 刪除單筆訂單
  const handleDeleteOrder = (subId: string, nickname: string, orderNumber: string) => {
    openAdminConfirmModal({
      isOpen: true,
      title: '🗑️ 刪除訂單',
      message: `確定要刪除「${nickname}」的訂單 #${orderNumber} 嗎？此動作將一併刪除該訂單的所有餐點明細，且無法復原。`,
      confirmText: '確定刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        setAllSubmissions((prev) => prev.filter((s) => s.id !== subId));
        setSelectedSubmissionIds((prev) => prev.filter((id) => id !== subId));
        showToast(`🗑️ 已刪除 ${nickname} 的訂單`);

        try {
          await supabase.from('order_items').delete().eq('submission_id', subId);
          const { error } = await supabase.from('order_submissions').delete().eq('id', subId);
          if (error) throw error;
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        } catch (err) {
          console.error('刪除訂單失敗:', err);
          showToast('❌ 刪除訂單失敗，正在重新同步...');
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      },
    });
  };

  // 13. 批次刪除訂單
  const handleBatchDeleteOrders = () => {
    if (!selectedSubmissionIds.length) return;
    const idsToDelete = [...selectedSubmissionIds];
    const count = idsToDelete.length;

    openAdminConfirmModal({
      isOpen: true,
      title: '🗑️ 批次刪除訂單',
      message: `確定要批次刪除選取的 ${count} 筆訂單嗎？此動作將一併刪除這些訂單的所有餐點明細，且無法復原。`,
      confirmText: '確定批次刪除',
      cancelText: '取消',
      isDanger: true,
      onConfirm: async () => {
        closeAdminConfirmModal();
        setAllSubmissions((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
        setSelectedSubmissionIds([]);
        showToast(`🗑️ 已批次刪除 ${count} 筆訂單`);

        try {
          await supabase.from('order_items').delete().in('submission_id', idsToDelete);
          const { error } = await supabase.from('order_submissions').delete().in('id', idsToDelete);
          if (error) throw error;
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        } catch (err) {
          console.error('批次刪除訂單失敗:', err);
          showToast('❌ 批次刪除失敗，正在重新同步...');
          fetchAdminData(selectedActiveGroupIdRef.current, true);
        }
      },
    });
  };

  // 14. 複製個人明細
  const handleCopyPersonalReceipt = async (sub: OrderSubmissionAdmin) => {
    let text = `📢【咩nu 團購金額對帳】\n${sub.user_nickname} 你好！你點了：\n---\n`;
    (sub.order_items || []).forEach((item) => {
      text += `• ${item.item_name} x ${item.quantity} ($${item.unit_price * item.quantity})\n`;
      if (item.custom_notes) text += `   備註：${item.custom_notes}\n`;
    });
    text += `---\n💰 個人小計：$${sub.final_amount} 元 (${sub.payment_method_name})\n`;
    text += `狀態：${sub.is_paid ? '✅ 已付款' : '⏳ 待付款'}\n請儘速核對金額，謝謝！`;

    try {
      await navigator.clipboard.writeText(text);
      showToast(`📋 已複製 ${sub.user_nickname} 的個人對帳明細！`);
    } catch {
      showToast('❌ 複製失敗');
    }
  };

  // 15. 複製報單文字
  const handleCopyStoreOrderText = async () => {
    let text = `📢【咩nu 團購向店家下單總表】\n店家：${activeGroup?.stores?.name || activeGroup?.title || '美味店家'}\n---\n`;
    Object.entries(itemSummary).forEach(([name, qty], idx) => {
      text += `${idx + 1}. ${name} x ${qty}\n`;
    });
    text += `---\n總份數：${Object.values(itemSummary).reduce((a, b) => a + b, 0)} 份\n總金額：$${grandTotal} 元\n感謝老闆！`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 已複製叫餐報單文字！');
    } catch {
      showToast('❌ 複製失敗');
    }
  };

  // 16. 複製催繳文字
  const handleCopyUnpaidReminder = async () => {
    const unpaidList = submissions.filter((s) => !s.is_paid);
    if (!unpaidList.length) {
      showToast('🎉 全員皆已完成付款，無須催繳！');
      return;
    }

    let text = `📢【咩nu 團購催繳提醒】\n活動：${activeGroup?.title}\n以下朋友尚未完成付款，請儘速繳費喔：\n---\n`;
    unpaidList.forEach((s) => {
      text += `• ${s.user_nickname}：$${s.final_amount} 元 (${s.payment_method_name})\n`;
    });
    text += `---\n感謝配合！`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('📢 已複製未付款催繳通知文字！');
    } catch {
      showToast('❌ 複製失敗');
    }
  };

  // 17. 匯出 CSV
  const handleExportOrdersCSV = () => {
    if (!submissions.length) {
      showToast('❌ 目前尚無訂單可匯出');
      return;
    }

    const headers = ['訂單編號', '訂購人', '付款方式', '缺貨備案', '付款狀態', '應付金額', '點餐明細', '下單時間'];
    const rows = submissions.map((sub) => {
      const itemsDetail = (sub.order_items || [])
        .map((i) => `${i.item_name} x ${i.quantity}${i.custom_notes ? ` (${i.custom_notes})` : ''}`)
        .join('; ');
      return [
        `#${sub.order_number}`,
        `"${sub.user_nickname.replace(/"/g, '""')}"`,
        `"${sub.payment_method_name}"`,
        `"${sub.sold_out_option || '無'}"`,
        sub.is_paid ? '已付款' : '未付款',
        sub.final_amount,
        `"${itemsDetail.replace(/"/g, '""')}"`,
        new Date(sub.created_at).toLocaleString(),
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `咩nu訂單匯出_${activeGroup?.title || '所有'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 訂單 CSV 已成功下載！');
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
    handleDeleteOrder,
    handleBatchDeleteOrders,
    handleCopyPersonalReceipt,
    handleCopyStoreOrderText,
    handleCopyUnpaidReminder,
    handleExportOrdersCSV,
  };
}
