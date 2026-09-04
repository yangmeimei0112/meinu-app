'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Trash2, X, ShieldAlert } from 'lucide-react';
import type { OrderProgressStatus } from '@/types/orderStatus';
import { ORDER_STATUS_META } from '@/types/orderStatus';

export interface DeleteOrderChoiceTarget {
  id: string | string[];
  orderNumber?: string;
  nickname?: string;
  count?: number;
  currentStatus: OrderProgressStatus;
}

interface AdminDeleteOrderChoiceModalProps {
  isOpen: boolean;
  target: DeleteOrderChoiceTarget | null;
  onClose: () => void;
  onConfirmChoice: (
    action: 'mark_completed' | 'mark_cancelled' | 'purge_everywhere',
    target: DeleteOrderChoiceTarget
  ) => void;
}

export function AdminDeleteOrderChoiceModal({
  isOpen,
  target,
  onClose,
  onConfirmChoice,
}: AdminDeleteOrderChoiceModalProps) {
  const [showPurgeDoubleConfirm, setShowPurgeDoubleConfirm] = useState(false);

  if (!isOpen || !target) return null;

  const statusMeta = ORDER_STATUS_META[target.currentStatus] || ORDER_STATUS_META.pending;
  const isBatch = Array.isArray(target.id) && target.id.length > 1;

  const handleAction = (action: 'mark_completed' | 'mark_cancelled' | 'purge_everywhere') => {
    if (action === 'purge_everywhere' && !showPurgeDoubleConfirm) {
      setShowPurgeDoubleConfirm(true);
      return;
    }
    onConfirmChoice(action, target);
    setShowPurgeDoubleConfirm(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 flex flex-col">
        {/* 頂部標題列 */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {isBatch ? `批次刪除 ${target.count} 筆訂單狀態設定` : '進行中訂單刪除確認'}
              </h3>
              <p className="text-xs text-slate-400">請指定刪除後為前台顧客顯示的訂單狀態</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容區塊 */}
        <div className="p-6 space-y-4">
          {/* 目標訂單摘要卡片 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#182234] border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {isBatch ? `已選取 ${target.count} 筆訂單` : `訂單 #${target.orderNumber} (${target.nickname})`}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
              >
                <span>目前狀態：{statusMeta.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              此訂單目前處於進行中階段，直接從後台刪除時，請選擇欲為前台點餐成員顯示之狀態：
            </p>
          </div>

          {showPurgeDoubleConfirm ? (
            /* ⚠️ 徹底抹除二次確認警告卡片 */
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>危險操作：確認連同前台紀錄徹底抹除？</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-relaxed">
                此動作將同時自後台資料庫與前台顧客之「我的歷史訂單」中徹底刪除，無任何存檔痕跡且無法復原！
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPurgeDoubleConfirm(false)}
                  className="flex-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  返回選項
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('purge_everywhere')}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-2 rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>確定徹底抹除</span>
                </button>
              </div>
            </div>
          ) : (
            /* 3 大操作選項按鈕清單 */
            <div className="space-y-2.5">
              {/* 選項 1: 標記已完成 */}
              <button
                type="button"
                onClick={() => handleAction('mark_completed')}
                className="w-full p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-left transition active:scale-[0.99] cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>標記為【已完成】並從後台移除</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    前台顧客歷史訂單將保留此筆紀錄，並顯示為「已完成」狀態
                  </p>
                </div>
              </button>

              {/* 選項 2: 標記已取消 */}
              <button
                type="button"
                onClick={() => handleAction('mark_cancelled')}
                className="w-full p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-left transition active:scale-[0.99] cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-amber-600" />
                    <span>標記為【已取消】並從後台移除</span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    前台顧客歷史訂單將保留此筆紀錄，並顯示為「已取消」狀態
                  </p>
                </div>
              </button>

              {/* 選項 3: 徹底抹除 */}
              <button
                type="button"
                onClick={() => setShowPurgeDoubleConfirm(true)}
                className="w-full p-3 rounded-2xl bg-rose-50/40 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40 text-left transition active:scale-[0.99] cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>💥 徹底抹除（連同前台紀錄一併刪除）</span>
                  </div>
                  <p className="text-[10px] text-rose-600/80 dark:text-rose-400/70">
                    前後台全數刪除，顧客端亦不留任何歷史明細（需二次確認）
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* 底部取消按鈕 */}
          {!showPurgeDoubleConfirm && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-2xl transition cursor-pointer"
              >
                取消返回
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
