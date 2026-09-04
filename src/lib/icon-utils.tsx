'use client';

import React from 'react';
import {
  Banknote,
  Landmark,
  CreditCard,
  Coins,
  CheckCircle2,
  Ban,
  Shuffle,
  PhoneCall,
  AlertCircle,
} from 'lucide-react';

/**
 * 徹底清除文字中可能殘留的任何 Unicode Emoji
 */
export function stripEmojis(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .trim();
}

/**
 * 根據付款方式名稱自動匹配並渲染專屬的 Lucide 純向量圖標 (如 Banknote 紙鈔圖示)
 */
export function PaymentMethodIcon({
  name,
  className = 'w-4 h-4 text-emerald-500 shrink-0',
}: {
  name?: string | null;
  className?: string;
}) {
  const clean = (name || '').toLowerCase();

  if (clean.includes('現金') || clean.includes('cash')) {
    return <Banknote className={className} />;
  }
  if (clean.includes('轉帳') || clean.includes('銀行') || clean.includes('匯款') || clean.includes('bank')) {
    return <Landmark className={className.replace('text-emerald-500', 'text-sky-500')} />;
  }
  if (clean.includes('line') || clean.includes('linepay')) {
    return <CheckCircle2 className={className.replace('text-emerald-500', 'text-green-500')} />;
  }
  if (clean.includes('街口') || clean.includes('pay') || clean.includes('卡') || clean.includes('card')) {
    return <CreditCard className={className.replace('text-emerald-500', 'text-rose-500')} />;
  }
  return <Coins className={className.replace('text-emerald-500', 'text-amber-500')} />;
}

/**
 * 根據缺貨備案選項自動匹配並渲染專屬的 Lucide 純向量圖標 (如 Ban 純向量禁止標示符號)
 */
export function SoldOutOptionIcon({
  title,
  className = 'w-4 h-4 text-rose-500 shrink-0',
}: {
  title?: string | null;
  className?: string;
}) {
  const clean = (title || '').toLowerCase();

  // 若缺貨直接取消 -> 統一純向量禁止標示符號 (Ban)
  if (clean.includes('取消') || clean.includes('不買') || clean.includes('cancel')) {
    return <Ban className={className} />;
  }
  // 替換/隨機 -> 隨機交換 (Shuffle)
  if (clean.includes('隨機') || clean.includes('替換') || clean.includes('其他') || clean.includes('換')) {
    return <Shuffle className={className.replace('text-rose-500', 'text-amber-500')} />;
  }
  // 電話/聯繫/通知 -> 通話聯繫 (PhoneCall)
  if (clean.includes('電話') || clean.includes('line') || clean.includes('聯繫') || clean.includes('聯絡')) {
    return <PhoneCall className={className.replace('text-rose-500', 'text-sky-500')} />;
  }
  return <AlertCircle className={className.replace('text-rose-500', 'text-slate-400')} />;
}
