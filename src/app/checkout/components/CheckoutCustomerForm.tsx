'use client';

import React from 'react';

interface CheckoutCustomerFormProps {
  nickname: string;
  onNicknameChange: (val: string) => void;
}

export default function CheckoutCustomerForm({
  nickname,
  onNicknameChange,
}: CheckoutCustomerFormProps) {
  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs space-y-2">
      <label
        htmlFor="checkout-nickname-input"
        className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
      >
        <span>
          2. 你的訂購暱稱 <span className="text-sky-500">*</span>
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-400">下次會自動記憶</span>
      </label>
      <input
        id="checkout-nickname-input"
        name="userNickname"
        type="text"
        placeholder="例如：小明 / 行銷部 賢義"
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
      />
    </div>
  );
}
