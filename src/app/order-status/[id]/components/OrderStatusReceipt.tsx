'use client';

import React from 'react';
import { PenTool, CheckCircle2 } from 'lucide-react';
import { PaymentMethodIcon, SoldOutOptionIcon, stripEmojis } from '@/lib/icon-utils';

interface OrderItemDetail {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

interface OrderSubmissionDetail {
  id: string;
  group_order_id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  signature_url?: string | null;
  signature_data?: string | null;
  created_at: string;
}

interface OrderStatusReceiptProps {
  order: OrderSubmissionDetail;
  orderItems: OrderItemDetail[];
}

export default function OrderStatusReceipt({ order, orderItems }: OrderStatusReceiptProps) {
  // 取得有效之對帳簽名圖檔 (支援 signature_data 或以圖片格式儲存之 signature_url)
  const signatureImage =
    order.signature_data ||
    (order.signature_url &&
    (order.signature_url.startsWith('data:image') ||
      order.signature_url.startsWith('http') ||
      order.signature_url.startsWith('/'))
      ? order.signature_url
      : null);

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
        點餐內容與明細
      </h3>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {orderItems.map((item) => (
          <div key={item.id} className="py-2.5 space-y-1">
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-100">
              <span>
                {item.item_name} x {item.quantity}
              </span>
              <span className="text-sky-600 dark:text-sky-400">${item.unit_price * item.quantity} 元</span>
            </div>
            {item.custom_notes && (
              <p className="text-xs text-slate-400 dark:text-slate-400">{item.custom_notes}</p>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex justify-between">
          <span>訂購人暱稱：</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">{order.user_nickname}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>付款方式：</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <PaymentMethodIcon name={order.payment_method_name} className="w-3.5 h-3.5 text-emerald-500" />
            <span>{stripEmojis(order.payment_method_name)}</span>
          </span>
        </div>
        {order.sold_out_option && (
          <div className="flex justify-between items-center">
            <span>缺貨備案：</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <SoldOutOptionIcon title={order.sold_out_option} className="w-3.5 h-3.5 text-rose-500" />
              <span>{stripEmojis(order.sold_out_option)}</span>
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm font-extrabold text-sky-600 dark:text-sky-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>應付總金額：</span>
          <span className="text-base">${order.final_amount} 元</span>
        </div>
      </div>

      {/* 🌟 對帳簽名欄位 (Reconciliation Signature) */}
      {signatureImage && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-sky-500" />
              <span>對帳核銷簽名：</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[10px] font-black px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>已核實簽名</span>
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-[#0B101B] p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center">
            <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs max-w-[260px] w-full flex items-center justify-center">
              <img
                src={signatureImage}
                alt="對帳簽名"
                className="h-12 sm:h-14 max-h-16 w-auto object-contain select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
