'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MenuItem, CustomGroup } from '@/types/database';
import { CartItem, SelectedOption } from '@/types/cart';

interface CustomModalProps {
  item: MenuItem | null;
  storeId: string;
  storeName: string;
  existingCartItem?: CartItem | null;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  onUpdateCartItem?: (updatedItem: CartItem) => void;
}

interface StoredDraftData {
  itemId: string;
  selectedOptions: Record<string, string[]>;
  quantity: number;
  customNotes: string;
  savedAt: number;
}

interface ValidatedDraft {
  data: StoredDraftData;
  summaryText: string;
}

// ----------------------------------------------------
// 🎨 純 SVG 精緻圖示（無 Emoji）
// ----------------------------------------------------
function IconHistory({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function IconCheck({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlertCircle({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function CustomModal({
  item,
  storeId,
  storeName,
  existingCartItem,
  onClose,
  onAddToCart,
  onUpdateCartItem,
}: CustomModalProps) {
  // ⚡ 優先直接讀取 item 內已預載的 custom_groups（進入商店時已在背景載入完畢，0ms 瞬開）
  const initialGroups = useMemo<CustomGroup[]>(() => {
    if (item?.custom_groups && Array.isArray(item.custom_groups)) {
      return item.custom_groups;
    }
    return [];
  }, [item]);

  const [prevItemId, setPrevItemId] = useState<string | null>(item?.id || null);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>(initialGroups);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState<number>(existingCartItem?.quantity || 1);
  const [customNotes, setCustomNotes] = useState<string>(existingCartItem?.customNotes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 📋 草稿系統狀態管理
  const [detectedDraft, setDetectedDraft] = useState<ValidatedDraft | null>(null);
  const [restoredToast, setRestoredToast] = useState<boolean>(false);
  const hasUserInteractedRef = useRef<boolean>(false);

  // 🛡️ 若 item.id 改變，於渲染期同步重置狀態，防止不同商品間的殘影
  if (item && prevItemId !== item.id) {
    setPrevItemId(item.id);
    setCustomGroups(initialGroups);
    setSelectedOptions({});
    setQuantity(existingCartItem?.quantity || 1);
    setCustomNotes(existingCartItem?.customNotes || '');
    setErrorMsg(null);
    setDetectedDraft(null);
    setRestoredToast(false);
    hasUserInteractedRef.current = false;
  }

  // ----------------------------------------------------
  // 🔍 嚴謹的草稿驗證與摘要建構函式
  // ----------------------------------------------------
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
            itemId: item?.id || '',
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
    [item?.id]
  );

  // ----------------------------------------------------
  // 1. 規格初始化與草稿偵測
  // ----------------------------------------------------
  useEffect(() => {
    if (!item) return;

    let groups = item.custom_groups && Array.isArray(item.custom_groups) ? item.custom_groups : [];

    if (groups.length === 0) {
      supabase
        .from('option_groups')
        .select(`
          id,
          title,
          min_select,
          max_select,
          option_items (
            id,
            name,
            extra_price
          )
        `)
        .eq('menu_item_id', item.id)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            interface OptionGroupRow {
              id: string;
              title: string;
              min_select: number;
              max_select: number;
              option_items: Array<{
                id: string;
                name: string;
                extra_price: number;
              }>;
            }
            const mappedGroups: CustomGroup[] = (data as unknown as OptionGroupRow[]).map((g) => ({
              id: g.id,
              title: g.title,
              type: g.max_select === 1 ? 'single' : g.max_select > 1 ? 'limit' : 'any',
              limit_number: g.max_select,
              options: (g.option_items || []).map((opt) => ({
                id: opt.id,
                name: opt.name,
                price_adjustment: opt.extra_price || 0,
              })),
            }));
            setCustomGroups(mappedGroups);
            initializeStateAndDraft(mappedGroups);
          }
        });
    } else {
      setCustomGroups(groups);
      initializeStateAndDraft(groups);
    }

    function initializeStateAndDraft(currentGroups: CustomGroup[]) {
      // 若為「修改購物車品項」模式，直接套用現有品項設定，不載入亦不覆蓋草稿
      if (existingCartItem && existingCartItem.rawCustomSelections) {
        setSelectedOptions(existingCartItem.rawCustomSelections);
        setDetectedDraft(null);
        return;
      }

      // ✨ 新增模式：預設留空所有選項
      const initialSelections: Record<string, string[]> = {};
      currentGroups.forEach((g) => {
        initialSelections[g.id] = [];
      });
      setSelectedOptions(initialSelections);

      // 檢查是否存在有效草稿
      const draftKey = `menu_app_draft_${item?.id}`;
      const rawDraft = localStorage.getItem(draftKey);
      if (rawDraft && currentGroups.length > 0) {
        const validated = validateDraft(rawDraft, currentGroups);
        if (validated) {
          setDetectedDraft(validated);
        } else {
          localStorage.removeItem(draftKey);
          setDetectedDraft(null);
        }
      } else {
        setDetectedDraft(null);
      }
    }
  }, [item, existingCartItem, validateDraft]);

  // ----------------------------------------------------
  // 2. 使用者實質操作時的自動儲存 (Auto-Save on Interaction)
  // ----------------------------------------------------
  useEffect(() => {
    // 僅在使用者已有明確互動、非購物車編輯模式、且商品有客製化群組時進行儲存
    if (!item || existingCartItem || !hasUserInteractedRef.current || customGroups.length === 0) {
      return;
    }

    const draftKey = `menu_app_draft_${item.id}`;
    const hasSelections = Object.values(selectedOptions).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    const hasNotes = customNotes.trim().length > 0;
    const hasChangedQty = quantity > 1;

    if (hasSelections || hasNotes || hasChangedQty) {
      const draftPayload: StoredDraftData = {
        itemId: item.id,
        selectedOptions,
        quantity,
        customNotes,
        savedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [selectedOptions, quantity, customNotes, item, existingCartItem, customGroups.length]);

  // ----------------------------------------------------
  // 3. 草稿操作：恢復草稿
  // ----------------------------------------------------
  const handleRestoreDraft = () => {
    if (!detectedDraft) return;

    hasUserInteractedRef.current = true;
    const { selectedOptions: draftOptions, quantity: draftQty, customNotes: draftNotes } = detectedDraft.data;

    // 將現有群組補齊預設值
    const mergedSelections: Record<string, string[]> = {};
    customGroups.forEach((g) => {
      mergedSelections[g.id] = draftOptions[g.id] || [];
    });

    setSelectedOptions(mergedSelections);
    setQuantity(draftQty);
    setCustomNotes(draftNotes);
    setDetectedDraft(null);
    setErrorMsg(null);

    // 顯示恢復成功的短暫提示
    setRestoredToast(true);
    setTimeout(() => setRestoredToast(false), 2200);
  };

  // ----------------------------------------------------
  // 4. 草稿操作：捨棄草稿
  // ----------------------------------------------------
  const handleDiscardDraft = () => {
    if (!item) return;
    const draftKey = `menu_app_draft_${item.id}`;
    localStorage.removeItem(draftKey);
    setDetectedDraft(null);
    hasUserInteractedRef.current = true;

    // 重置所有選項為空
    const resetSelections: Record<string, string[]> = {};
    customGroups.forEach((g) => {
      resetSelections[g.id] = [];
    });
    setSelectedOptions(resetSelections);
    setQuantity(1);
    setCustomNotes('');
    setErrorMsg(null);
  };

  if (!item) return null;

  // ----------------------------------------------------
  // 5. 處理選項點擊
  // ----------------------------------------------------
  const handleSelectOption = (group: CustomGroup, optionId: string) => {
    hasUserInteractedRef.current = true;
    setErrorMsg(null);
    if (detectedDraft) setDetectedDraft(null); // 使用者開始自選新規格時淡出草稿提示

    const currentList = selectedOptions[group.id] || [];

    if (group.type === 'single') {
      setSelectedOptions((prev) => ({ ...prev, [group.id]: [optionId] }));
    } else if (group.type === 'any') {
      const updated = currentList.includes(optionId)
        ? currentList.filter((id) => id !== optionId)
        : [...currentList, optionId];
      setSelectedOptions((prev) => ({ ...prev, [group.id]: updated }));
    } else if (group.type === 'limit') {
      const limitMax = group.limit_number || 1;
      if (currentList.includes(optionId)) {
        setSelectedOptions((prev) => ({
          ...prev,
          [group.id]: currentList.filter((id) => id !== optionId),
        }));
      } else {
        if (currentList.length >= limitMax) {
          setErrorMsg(`「${group.title}」最多只能選擇 ${limitMax} 個選項！`);
          return;
        }
        setSelectedOptions((prev) => ({
          ...prev,
          [group.id]: [...currentList, optionId],
        }));
      }
    }
  };

  // 計算加價總額與選取項目文字
  let totalExtraPrice = 0;
  const formattedSelectedOptions: SelectedOption[] = [];

  customGroups.forEach((group) => {
    const selectedIds = selectedOptions[group.id] || [];
    group.options.forEach((opt) => {
      if (selectedIds.includes(opt.id)) {
        totalExtraPrice += opt.price_adjustment || 0;
        formattedSelectedOptions.push({
          groupTitle: group.title,
          itemName: opt.name,
          extraPrice: opt.price_adjustment || 0,
        });
      }
    });
  });

  const singleUnitPrice = item.price + totalExtraPrice;
  const itemTotalPrice = singleUnitPrice * quantity;

  // ----------------------------------------------------
  // 6. 確認加入購物車或更新購物車
  // ----------------------------------------------------
  const handleConfirm = () => {
    // 驗證必選規則
    for (const group of customGroups) {
      const selected = selectedOptions[group.id] || [];
      if (group.type === 'single' && selected.length === 0) {
        setErrorMsg(`請選擇「${group.title}」（必選 1 個）`);
        return;
      }
      if (group.type === 'limit' && group.limit_number && selected.length === 0) {
        setErrorMsg(`請選擇「${group.title}」（至少選 1 個，最多 ${group.limit_number} 個）`);
        return;
      }
    }

    const cartItemPayload: CartItem = {
      cartItemId: existingCartItem ? existingCartItem.cartItemId : `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      storeId,
      storeName,
      name: item.name,
      unitPrice: item.price,
      quantity,
      selectedOptions: formattedSelectedOptions,
      customNotes,
      totalPrice: itemTotalPrice,
      rawCustomSelections: selectedOptions,
    };

    if (existingCartItem && onUpdateCartItem) {
      onUpdateCartItem(cartItemPayload);
    } else {
      onAddToCart(cartItemPayload);
      // 送入購物車後，徹底清除此商品的草稿紀錄
      localStorage.removeItem(`menu_app_draft_${item.id}`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#131B2B] text-slate-800 dark:text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Modal 頂部標題 */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{item.name}</span>
              {existingCartItem && (
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
                  修改規格
                </span>
              )}
            </h3>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-extrabold mt-0.5">
              基本單價 ${item.price} 元起
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center text-sm font-bold active:scale-95 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 📋 精緻草稿恢復提示條 (附帶上次選擇內容摘要) */}
        {detectedDraft && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200 gap-3">
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 font-black text-amber-800 dark:text-amber-300">
                <IconHistory className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>偵測到上次選到一半的草稿</span>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 truncate font-medium max-w-[210px] sm:max-w-[240px]">
                {detectedDraft.summaryText}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
              >
                恢復選擇
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] font-bold px-1.5 py-1 transition cursor-pointer"
              >
                捨棄
              </button>
            </div>
          </div>
        )}

        {/* ✅ 草稿已恢復成功提示 */}
        {restoredToast && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900/60 px-4 py-2 flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold animate-in fade-in duration-150">
            <IconCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>已成功為您恢復上次選取的客製化草稿！</span>
          </div>
        )}

        {/* ⚠️ 錯誤警告 */}
        {errorMsg && (
          <div className="mx-4 mt-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/60 flex items-center gap-1.5 animate-shake">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 客製選項主體 (即時呈現，零延遲) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
          {customGroups.length > 0 &&
            customGroups.map((group) => {
              const currentSelected = selectedOptions[group.id] || [];
              return (
                <div key={group.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="flex items-center gap-1">
                      <span>{group.title}</span>
                      {group.type === 'single' && <span className="text-sky-500">*</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                      {group.type === 'single' && '必選 1 個'}
                      {group.type === 'any' && '可多選或不選'}
                      {group.type === 'limit' && `最多選 ${group.limit_number || 1} 個`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isChecked = currentSelected.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(group, opt.id)}
                          className={`p-2.5 rounded-2xl text-xs font-bold border text-left transition flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                            isChecked
                              ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className="truncate mr-1">{opt.name}</span>
                          {opt.price_adjustment > 0 ? (
                            <span
                              className={`text-[10px] font-extrabold shrink-0 ${
                                isChecked ? 'text-white' : 'text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              +${opt.price_adjustment}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] ${
                                isChecked ? 'text-sky-100' : 'text-slate-400 dark:text-slate-400'
                              }`}
                            >
                              +0
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* 特製備註輸入框 */}
          <div className="pt-3 space-y-1.5">
            <label htmlFor="custom-notes-input" className="text-xs font-bold text-slate-700 dark:text-slate-200">
              特製備註 (選填)
            </label>
            <input
              id="custom-notes-input"
              name="customNotes"
              type="text"
              placeholder="有其他個人需求嗎？填寫備註..."
              value={customNotes}
              onChange={(e) => {
                hasUserInteractedRef.current = true;
                setCustomNotes(e.target.value);
              }}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 購買數量調整 */}
          <div className="pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">購買數量</span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  hasUserInteractedRef.current = true;
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-100">{quantity}</span>
              <button
                type="button"
                onClick={() => {
                  hasUserInteractedRef.current = true;
                  setQuantity((q) => q + 1);
                }}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-sm flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Modal 底部結算與按鈕 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">合計金額</span>
            <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">${itemTotalPrice} 元</span>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition active:scale-[0.99] flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{existingCartItem ? '儲存修改' : '加入購物車'}</span>
            <span>(${itemTotalPrice} 元)</span>
          </button>
        </div>
      </div>
    </div>
  );
}