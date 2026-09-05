'use client';

import React from 'react';
import {
  AlertTriangle,
  X,
  User,
  ShoppingBag,
  Store,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react';

export interface CancelledOrderItemInfo {
  name: string;
  quantity: number;
  notes?: string | null;
  unitPrice?: number;
}

export interface CancelledOrderNotification {
  id: string;
  nickname: string;
  orderNumber?: string;
  storeName?: string;
  totalAmount: number;
  items: CancelledOrderItemInfo[];
  cancelledAt: string;
}

interface AdminCancelledOrderModalProps {
  isOpen: boolean;
  order: CancelledOrderNotification | null;
  remainingCount?: number;
  onClose: () => void;
}

export function AdminCancelledOrderModal({
  isOpen,
  order,
  remainingCount = 0,
  onClose,
}: AdminCancelledOrderModalProps) {
  if (!isOpen || !order) return null;

  const totalQuantity = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancelled-order-modal-title"
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#111A2E] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-rose-200/80 dark:border-rose-900/60 animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* 頂部警告橫幅 */}
        <div className="p-5 border-b border-rose-100 dark:border-rose-950/60 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="cancelled-order-modal-title"
                  className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400 tracking-tight"
                >
                  顧客已取消訂單通知
                </h3>
                {remainingCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    尚有 {remainingCount} 筆取消
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                前台顧客已點擊「取消訂單」或「修改訂單退回購物車」
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="關閉通知"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 內容主體 */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* 顧客與店家主要資訊卡片 */}
          <div className="bg-slate-50 dark:bg-[#162238] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* 顧客暱稱 */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">點餐成員</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                    {order.nickname || '未填寫暱稱'}
                  </p>
                </div>
              </div>

              {/* 訂單編號 */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">訂單單號</p>
                  <p className="font-mono font-black text-slate-800 dark:text-slate-100 text-sm">
                    {order.orderNumber ? `#${order.orderNumber}` : '一般訂單'}
                  </p>
                </div>
              </div>

              {/* 店家名稱 */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">所屬店家</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
                    {order.storeName || '團購店家'}
                  </p>
                </div>
              </div>

              {/* 取消時間 */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">取消時間</p>
                  <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {order.cancelledAt || '剛剛'}
                  </p>
                </div>
              </div>
            </div>

            {/* 總金額條 */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                原訂總金額 ({totalQuantity} 份餐點)
              </span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                ${Math.round(order.totalAmount || 0)}
              </span>
            </div>
          </div>

          {/* 餐點品項明細清單 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                <span>原訂購品項明細</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                共 {order.items?.length || 0} 個品項
              </span>
            </div>

            <div className="bg-slate-50/70 dark:bg-[#152033]/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </span>
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                          x{item.quantity}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 rounded-md inline-block">
                          備註：{item.notes}
                        </p>
                      )}
                    </div>
                    {item.unitPrice !== undefined && item.unitPrice > 0 && (
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">
                        ${item.unitPrice * item.quantity}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  無特定品項明細記錄
                </div>
              )}
            </div>
          </div>

          {/* 說明提示卡片 */}
          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed flex items-start gap-2">
            <span className="shrink-0 mt-0.5">💡</span>
            <span>
              系統已自動自後台即時接單列表中清除此筆訂單。若顧客是點選「退回購物車修改」，稍後可能會送出調整後的全新訂單。
            </span>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0D1525] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black text-xs transition active:scale-95 shadow-md shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {remainingCount > 0 ? (
              <>
                <span>查看下一筆取消通知</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>我知道了</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
