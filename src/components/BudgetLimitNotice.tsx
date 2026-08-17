'use client';

interface BudgetLimitNoticeProps {
  budgetLimit?: number | null;
  totalAmount: number;
}

export default function BudgetLimitNotice({
  budgetLimit,
  totalAmount,
}: BudgetLimitNoticeProps) {
  if (!budgetLimit || budgetLimit <= 0) return null;

  const isOverBudget = totalAmount > budgetLimit;
  const difference = isOverBudget
    ? totalAmount - budgetLimit
    : budgetLimit - totalAmount;

  return (
    <div
      className={`rounded-2xl p-3 text-xs font-semibold border flex items-start gap-2.5 transition-all ${
        isOverBudget
          ? 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
          : 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
      }`}
    >
      <span className="text-base shrink-0">{isOverBudget ? '💡' : '🎉'}</span>
      <div className="space-y-0.5 flex-1">
        <div className="flex items-center justify-between font-bold">
          <span>個人預算補貼提醒</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            上限 ${budgetLimit}
          </span>
        </div>
        {isOverBudget ? (
          <p className="text-[11px] leading-relaxed opacity-95">
            本次團購每人補貼上限為 <span className="font-extrabold">${budgetLimit} 元</span>，您目前已選{' '}
            <span className="font-extrabold">${totalAmount} 元</span>（需自付差額{' '}
            <span className="font-extrabold text-amber-700 dark:text-amber-300 underline underline-offset-2">
              ${difference} 元
            </span>
            ）。
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed opacity-95">
            本次團購每人補貼上限為 <span className="font-extrabold">${budgetLimit} 元</span>，您目前已選{' '}
            <span className="font-extrabold">${totalAmount} 元</span>（公費補助，尚有餘額{' '}
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300">${difference} 元</span>）。
          </p>
        )}
      </div>
    </div>
  );
}
