'use client';

import React from 'react';
import Link from 'next/link';
import { Store, CheckCircle2, Clock, RotateCcw, ArrowRight } from 'lucide-react';
import { PaymentMethodIcon, stripEmojis } from '@/lib/icon-utils';

export interface OrderItemRow {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

export interface OrderHistoryRecord {
  id: string;
  group_order_id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  created_at: string;
  order_items: OrderItemRow[];
  group_orders?: {
    id: string;
    store_id: string;
    stores?: {
      id: string;
      name: string;
      image_url: string | null;
    };
  };
}

interface MyOrderHistoryCardProps {
  order: OrderHistoryRecord;
  onReorder: (order: OrderHistoryRecord) => void;
}

export function MyOrderHistoryCard({ order, onReorder }: MyOrderHistoryCardProps) {
  const storeName = order.group_orders?.stores?.name || '團購店家';
  const formattedDate = new Date(order.created_at).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3.5">
      {/* 頂部店家與狀態 */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-sky-500 shrink-0" />
            <span>{storeName}</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
            單號 #{order.order_number} • {formattedDate}
          </p>
        </div>

        <div>
          {order.is_paid ? (
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>已付款</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-extrabold px-3 py-1 rounded-full animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>待對帳</span>
            </span>
          )}
        </div>
      </div>

      {/* 餐點明細 */}
      <div className="divide-y divide-slate-100 dark:border-slate-800">
        {order.order_items.map((item) => (
          <div key={item.id} className="py-2 space-y-0.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>
                {item.item_name} x {item.quantity}
              </span>
              <span>${item.unit_price * item.quantity} 元</span>
            </div>
            {item.custom_notes && (
              <p className="text-[11px] text-slate-400 dark:text-slate-400">{item.custom_notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* 總結與付款方式 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span>付款方式：</span>
          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <PaymentMethodIcon name={order.payment_method_name} className="w-3.5 h-3.5 text-emerald-500" />
            <span>{stripEmojis(order.payment_method_name)}</span>
          </span>
        </span>
        <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm">
          合計 ${order.final_amount} 元
        </span>
      </div>

      {/* 底部操作按鈕：一鍵再點一次 & 查看狀態 */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onReorder(order)}
          className="bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-300 font-bold text-xs py-2.5 rounded-2xl border border-sky-100 dark:border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>一鍵再點一次</span>
        </button>

        <Link
          href={`/order-status/${order.id}`}
          className="bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-2xl text-center shadow-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>查看詳細</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
