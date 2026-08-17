'use client';

import React from 'react';

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
  created_at: string;
}

interface OrderStatusReceiptProps {
  order: OrderSubmissionDetail;
  orderItems: OrderItemDetail[];
}

export default function OrderStatusReceipt({ order, orderItems }: OrderStatusReceiptProps) {
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
        <div className="flex justify-between">
          <span>付款方式：</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">{order.payment_method_name}</span>
        </div>
        {order.sold_out_option && (
          <div className="flex justify-between">
            <span>缺貨備案：</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{order.sold_out_option}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-extrabold text-sky-600 dark:text-sky-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>應付總金額：</span>
          <span className="text-base">${order.final_amount} 元</span>
        </div>
      </div>
    </div>
  );
}
