'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CustomGroup } from '@/types/database';

export interface StoredDraftData {
  itemId: string;
  selectedOptions: Record<string, string[]>;
  quantity: number;
  customNotes: string;
  savedAt: number;
}

export interface ValidatedDraft {
  data: StoredDraftData;
  summaryText: string;
}

interface UseCustomModalDraftProps {
  itemId: string | undefined;
  isEditMode: boolean;
  customGroups: CustomGroup[];
  selectedOptions: Record<string, string[]>;
  quantity: number;
  customNotes: string;
  setSelectedOptions: (opts: Record<string, string[]>) => void;
  setQuantity: (q: number) => void;
  setCustomNotes: (notes: string) => void;
  setErrorMsg: (msg: string | null) => void;
}

export function useCustomModalDraft({
  itemId,
  isEditMode,
  customGroups,
  selectedOptions,
  quantity,
  customNotes,
  setSelectedOptions,
  setQuantity,
  setCustomNotes,
  setErrorMsg,
}: UseCustomModalDraftProps) {
  const [detectedDraft, setDetectedDraft] = useState<ValidatedDraft | null>(null);
  const [restoredToast, setRestoredToast] = useState<boolean>(false);
  const hasUserInteractedRef = useRef<boolean>(false);

  // 🔍 嚴謹的草稿驗證與摘要建構函式
  const validateDraft = useCallback(
    (rawJson: string, groups: CustomGroup[]): ValidatedDraft | null => {
      try {
        const parsed = JSON.parse(rawJson);
        if (!parsed || typeof parsed !== 'object') return null;

        // 1. 檢查草稿時效 (有效期限 7 天)
        const savedAt = typeof parsed.savedAt === 'number' ? parsed.savedAt : 0;
        if (Date.now() - savedAt > 7 * 86400000) {
          return null;
        }

        // 2. 清洗並校驗選項：確認所選 optionId 依然存在於現有群組中
        const validSelections: Record<string, string[]> = {};
        const summaryParts: string[] = [];

        groups.forEach((group) => {
          const rawSelected = parsed.selectedOptions?.[group.id];
          if (Array.isArray(rawSelected)) {
            const validOptionIds = rawSelected.filter((id: string) =>
              group.options.some((opt) => opt.id === id)
            );
            if (validOptionIds.length > 0) {
              validSelections[group.id] = validOptionIds;
              const optionNames = group.options
                .filter((opt) => validOptionIds.includes(opt.id))
                .map((opt) => opt.name);
              summaryParts.push(optionNames.join('、'));
            }
          }
        });

        const validQuantity =
          typeof parsed.quantity === 'number' && parsed.quantity >= 1 ? parsed.quantity : 1;
        const validNotes = typeof parsed.customNotes === 'string' ? parsed.customNotes.trim() : '';

        if (validQuantity > 1) {
          summaryParts.push(`數量 ${validQuantity}`);
        }
        if (validNotes) {
          summaryParts.push(`備註: ${validNotes}`);
        }

        // 3. 必須至少有一項實質自訂（選項、備註或數量變更）
        if (summaryParts.length === 0) {
          return null;
        }

        return {
          data: {
            itemId: itemId || '',
            selectedOptions: validSelections,
            quantity: validQuantity,
            customNotes: validNotes,
            savedAt,
          },
          summaryText: summaryParts.join(' / '),
        };
      } catch (e) {
        console.error('草稿解析失敗:', e);
        return null;
      }
    },
    [itemId]
  );

  // 1. 初始化檢查草稿
  const checkForDraft = useCallback(
    (groups: CustomGroup[]) => {
      if (!itemId || isEditMode) {
        setDetectedDraft(null);
        return;
      }
      const draftKey = `menu_app_draft_${itemId}`;
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft && groups.length > 0) {
        const validated = validateDraft(rawDraft, groups);
        if (validated) {
          setDetectedDraft(validated);
        } else {
          localStorage.removeItem(draftKey);
          setDetectedDraft(null);
        }
      } else {
        setDetectedDraft(null);
      }
    },
    [itemId, isEditMode, validateDraft]
  );

  // 2. 自動儲存
  useEffect(() => {
    if (!itemId || isEditMode || !hasUserInteractedRef.current || customGroups.length === 0) {
      return;
    }

    const draftKey = `menu_app_draft_${itemId}`;
    const hasSelections = Object.values(selectedOptions).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    const hasNotes = customNotes.trim().length > 0;
    const hasChangedQty = quantity > 1;

    if (hasSelections || hasNotes || hasChangedQty) {
      const draftPayload: StoredDraftData = {
        itemId,
        selectedOptions,
        quantity,
        customNotes,
        savedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [selectedOptions, quantity, customNotes, itemId, isEditMode, customGroups.length]);

  // 3. 恢復草稿
  const handleRestoreDraft = () => {
    if (!detectedDraft) return;

    hasUserInteractedRef.current = true;
    const { selectedOptions: draftOptions, quantity: draftQty, customNotes: draftNotes } = detectedDraft.data;

    const mergedSelections: Record<string, string[]> = {};
    customGroups.forEach((g) => {
      mergedSelections[g.id] = draftOptions[g.id] || [];
    });

    setSelectedOptions(mergedSelections);
    setQuantity(draftQty);
    setCustomNotes(draftNotes);
    setDetectedDraft(null);
    setErrorMsg(null);

    setRestoredToast(true);
    setTimeout(() => setRestoredToast(false), 2200);
  };

  // 4. 捨棄草稿
  const handleDiscardDraft = () => {
    if (!itemId) return;
    const draftKey = `menu_app_draft_${itemId}`;
    localStorage.removeItem(draftKey);
    setDetectedDraft(null);
    hasUserInteractedRef.current = true;

    const resetSelections: Record<string, string[]> = {};
    customGroups.forEach((g) => {
      resetSelections[g.id] = [];
    });
    setSelectedOptions(resetSelections);
    setQuantity(1);
    setCustomNotes('');
    setErrorMsg(null);
  };

  const clearDraft = useCallback(() => {
    if (itemId) {
      localStorage.removeItem(`menu_app_draft_${itemId}`);
    }
  }, [itemId]);

  const markInteracted = () => {
    hasUserInteractedRef.current = true;
  };

  return {
    detectedDraft,
    setDetectedDraft,
    restoredToast,
    setRestoredToast,
    hasUserInteractedRef,
    checkForDraft,
    handleRestoreDraft,
    handleDiscardDraft,
    clearDraft,
    markInteracted,
  };
}
