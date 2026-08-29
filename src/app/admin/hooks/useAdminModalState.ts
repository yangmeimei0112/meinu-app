'use client';

import { useState, useCallback } from 'react';
import { OrderSubmissionAdmin, AdminConfirmModalState } from '../admin-types';

export function useAdminModalState() {
  // 列印 / 手工補單 / 批量匯入 / 團購設定 Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState<boolean>(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState<boolean>(false);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState<boolean>(false);
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState<boolean>(false);

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
