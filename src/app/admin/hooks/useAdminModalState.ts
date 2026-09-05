'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { OrderSubmissionAdmin, AdminConfirmModalState } from '../admin-types';
import type { CancelledOrderNotification } from '../components/modals/AdminCancelledOrderModal';

const STORAGE_KEY_CANCEL_MODAL = 'menu_app_admin_cancel_modal_enabled';

export function useAdminModalState() {
  // 列印 / 手工補單 / 批量匯入 / 團購設定 Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState<boolean>(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState<boolean>(false);
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState<boolean>(false);

  // 訂單取消彈窗通知開關與佇列
  const [isCancelModalEnabled, setIsCancelModalEnabled] = useState<boolean>(true);
  const isCancelModalEnabledRef = useRef<boolean>(true);
  const [cancelledOrderQueue, setCancelledOrderQueue] = useState<CancelledOrderNotification[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CANCEL_MODAL);
      if (saved !== null) {
        const val = saved === 'true';
        setIsCancelModalEnabled(val);
        isCancelModalEnabledRef.current = val;
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleCancelModal = useCallback((): boolean => {
    const next = !isCancelModalEnabledRef.current;
    setIsCancelModalEnabled(next);
    isCancelModalEnabledRef.current = next;
    try {
      localStorage.setItem(STORAGE_KEY_CANCEL_MODAL, String(next));
    } catch (e) {
      console.error(e);
    }
    return next;
  }, []);

  const pushCancelledOrder = useCallback((order: CancelledOrderNotification) => {
    if (!isCancelModalEnabledRef.current) return;
    setCancelledOrderQueue((prev) => {
      // 避免相同 ID 重複進入佇列
      if (prev.some((o) => o.id === order.id)) return prev;
      return [...prev, order];
    });
  }, []);

  const dismissCurrentCancelledOrder = useCallback(() => {
    setCancelledOrderQueue((prev) => (prev.length > 0 ? prev.slice(1) : []));
  }, []);

  const clearCancelledOrders = useCallback(() => {
    setCancelledOrderQueue([]);
  }, []);

  // 簽名與找零 Modal
  const [signatureTarget, setSignatureTarget] = useState<OrderSubmissionAdmin | null>(null);
  const [changeModalTarget, setChangeModalTarget] = useState<{ nickname: string; amount: number } | null>(null);
  const [receivedCash, setReceivedCash] = useState<string>('');

  // 二次確認 Modal
  const [adminConfirmModal, setAdminConfirmModal] = useState<AdminConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '確定',
    cancelText: '取消',
    isDanger: false,
    onConfirm: () => {},
  });

  const openAdminConfirmModal = useCallback((modal: AdminConfirmModalState) => {
    setAdminConfirmModal({
      ...modal,
      confirmText: modal.confirmText || '確定',
      cancelText: modal.cancelText || '取消',
      isDanger: modal.isDanger ?? false,
    });
  }, []);

  const closeAdminConfirmModal = useCallback(() => {
    setAdminConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    isPrintModalOpen,
    setIsPrintModalOpen,
    isManualOrderModalOpen,
    setIsManualOrderModalOpen,
    isBatchImportModalOpen,
    setIsBatchImportModalOpen,
    isGroupSettingsModalOpen,
    setIsGroupSettingsModalOpen,
    showVoiceSettingsModal,
    setShowVoiceSettingsModal,
    isCancelModalEnabled,
    toggleCancelModal,
    cancelledOrderQueue,
    pushCancelledOrder,
    dismissCurrentCancelledOrder,
    clearCancelledOrders,
    signatureTarget,
    setSignatureTarget,
    changeModalTarget,
    setChangeModalTarget,
    receivedCash,
    setReceivedCash,
    adminConfirmModal,
    openAdminConfirmModal,
    closeAdminConfirmModal,
  };
}
