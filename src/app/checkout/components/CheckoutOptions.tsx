'use client';

import React from 'react';
import { PaymentMethod, SoldOutOption } from '@/types/database';

interface CheckoutOptionsProps {
  paymentMethods: PaymentMethod[];
  selectedPayment: string;
  onSelectPayment: (name: string) => void;
  soldOutOptions: SoldOutOption[];
  selectedSoldOut: string;
  onSelectSoldOut: (title: string) => void;
  onCopyAccount: (account: string) => void;
}

export default function CheckoutOptions({
  paymentMethods,
  selectedPayment,
  onSelectPayment,
  soldOutOptions,
  selectedSoldOut,
  onSelectSoldOut,
  onCopyAccount,
}: CheckoutOptionsProps) {
  return (
    <>
      {/* 3. 選擇付款方式 */}
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">3. 選擇付款方式</h3>
        <div className="space-y-2">
          {paymentMethods.map((pm) => {
            const isSelected = selectedPayment === pm.name;
            return (
              <div
                key={pm.id}
                onClick={() => onSelectPayment(pm.name)}
                className={`p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{pm.name}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && '✓'}
                  </span>
                </div>
                {pm.account_info && (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mr-2">
                      {pm.account_info}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyAccount(pm.account_info || '');
                      }}
                      className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 transition cursor-pointer"
                    >
                      📋 複製帳號
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 若店家品項缺貨時的備案 */}
      <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">4. 若店家品項缺貨時的備案</h3>
        <div className="space-y-2">
          {soldOutOptions.map((so) => {
            const isSelected = selectedSoldOut === so.title;
            return (
              <div
                key={so.id}
                onClick={() => onSelectSoldOut(so.title)}
                className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-300'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span>{so.title}</span>
                {isSelected && <span className="font-bold">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
