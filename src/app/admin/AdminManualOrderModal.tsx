'use client';

import { useState } from 'react';
import type { MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
import { GroupOrderAdmin } from './admin-types';
import { supabase } from '@/lib/supabase';
import { generateSequentialOrderNumber } from '@/lib/order-utils';

interface AdminManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupOrder: GroupOrderAdmin | null;
  menuItems: MenuItem[];
  paymentMethods: PaymentMethod[];
  soldOutOptions: SoldOutOption[];
  onOrderAdded: () => void;
}

export default function AdminManualOrderModal({
  isOpen,
  onClose,
  groupOrder,
  menuItems,
  paymentMethods,
  soldOutOptions,
  onOrderAdded,
}: AdminManualOrderModalProps) {
  const [nickname, setNickname] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>(menuItems[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethods[0]?.name || '現金付款');
  const [soldOutOption, setSoldOutOption] = useState<string>(soldOutOptions[0]?.title || '直接取消該餐點');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen || !groupOrder) return null;

  const currentItem = menuItems.find((item) => item.id === selectedItemId) || menuItems[0];
  const itemTotal = currentItem ? currentItem.price * quantity : 0;

  const handleManualSubmit = async () => {
    setStatusMsg(null);
    if (!nickname.trim()) {
      setStatusMsg({ text: '⚠️ 請填寫朋友暱稱！', isError: true });
      return;
    }
    if (!currentItem) {
      setStatusMsg({ text: '⚠️ 請選擇餐點品項！', isError: true });
      return;
    }

    setIsSubmitting(true);
    try {
      // 🔢 規律化循序單號生成 (MN-001, MN-002, MN-003 ...)
      const orderNumber = await generateSequentialOrderNumber(supabase, groupOrder.id);
      const { data: submission, error: subErr } = await supabase
        .from('order_submissions')
        .insert({
          group_order_id: groupOrder.id,
          order_number: orderNumber,
          user_nickname: nickname.trim(),
          payment_method_name: paymentMethod,
          sold_out_option: soldOutOption,
          total_amount: itemTotal,
          final_amount: itemTotal,
          is_paid: false,
        })
        .select('id')
        .single();

      if (subErr || !submission) throw new Error('建立代點訂單失敗');

      await supabase.from('order_items').insert({
        submission_id: submission.id,
        item_name: currentItem.name,
        quantity: quantity,
        unit_price: currentItem.price,
        custom_notes: customNotes.trim() ? customNotes.trim() : null,
      });

      setStatusMsg({ text: `🎉 已成功幫「${nickname.trim()}」代點餐點！`, isError: false });
      setTimeout(() => {
        setNickname('');
        setCustomNotes('');
        setQuantity(1);
        onOrderAdded();
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: '❌ 代點失敗，請稍後重試', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#131B2B] w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">✍️</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">團長代點餐 / 人工補單</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">幫現場或發 LINE 的朋友手動新增一筆訂單</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 🌟 自訂狀態與錯誤提示通知視窗橫幅 */}
        {statusMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold border animate-in fade-in zoom-in-95 duration-150 ${
              statusMsg.isError
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/70 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/70 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* 朋友暱稱 */}
          <div className="space-y-1">
            <label htmlFor="manual-order-nickname" className="text-xs font-bold text-slate-700 dark:text-slate-300">朋友暱稱 <span className="text-rose-500">*</span></label>
            <input
              id="manual-order-nickname"
              name="manualNickname"
              type="text"
              placeholder="例如：小明 / 研發部 阿義"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 選擇餐點 */}
          <div className="space-y-1">
            <label htmlFor="manual-order-item" className="text-xs font-bold text-slate-700 dark:text-slate-300">選擇餐點品項</label>
            <select
              id="manual-order-item"
              name="manualItemId"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (${item.price} 元) {item.is_sold_out ? '【已售完】' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 數量 */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">點餐數量</span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-transparent dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-100">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-xs active:scale-95 text-xs flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* 規格與備註 */}
          <div className="space-y-1">
            <label htmlFor="manual-order-custom-notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">客製規格與特製備註</label>
            <input
              id="manual-order-custom-notes"
              name="manualCustomNotes"
              type="text"
              placeholder="例如：微糖少冰、加珍珠"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* 付款方式 */}
          <div className="space-y-1">
            <label htmlFor="manual-order-payment-method" className="text-xs font-bold text-slate-700 dark:text-slate-300">付款方式</label>
            <select
              id="manual-order-payment-method"
              name="manualPaymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.name}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          {/* 缺貨備案 */}
          <div className="space-y-1">
            <label htmlFor="manual-order-soldout-option" className="text-xs font-bold text-slate-700 dark:text-slate-300">遇缺貨備案</label>
            <select
              id="manual-order-soldout-option"
              name="manualSoldOutOption"
              value={soldOutOption}
              onChange={(e) => setSoldOutOption(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {soldOutOptions.map((so) => (
                <option key={so.id} value={so.title}>
                  {so.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-400 dark:text-slate-400 font-bold block">合計金額</span>
            <span className="text-base font-extrabold text-sky-600 dark:text-sky-400">${itemTotal} 元</span>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleManualSubmit}
            className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? '正在寫入...' : '➕ 確定新增代點訂單'}
          </button>
        </div>
      </div>
    </div>
  );
}
