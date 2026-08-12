import { OrderSubmissionAdmin } from './admin-types';

interface AdminDashboardSectionProps {
  submissions: OrderSubmissionAdmin[];
  itemSummary: Record<string, number>;
  grandTotal: number;
  paidTotal: number;
  inputDeliveryFee: number;
  inputDiscount: number;
  roundingRule: 'floor' | 'ceil' | 'round';
  selectedSubmissionIds: string[];
  setSelectedSubmissionIds: (value: string[]) => void;
  calculateAdjustedAmount: (baseAmount: number) => number;
  setInputDeliveryFee: (value: number) => void;
  setInputDiscount: (value: number) => void;
  setRoundingRule: (value: 'floor' | 'ceil' | 'round') => void;
  handleApplyFeeSplit: () => void;
  handleBatchMarkPaid: () => void;
  handleTogglePaid: (subId: string, currentStatus: boolean) => void;
  setSignatureTarget: (value: OrderSubmissionAdmin | null) => void;
  setChangeModalTarget: (value: { nickname: string; amount: number } | null) => void;
  handleCopyPersonalReceipt: (sub: OrderSubmissionAdmin) => void;
  handleArchiveGroup: () => void;
}

export function AdminDashboardSection({
  submissions,
  itemSummary,
  grandTotal,
  paidTotal,
  inputDeliveryFee,
  inputDiscount,
  roundingRule,
  selectedSubmissionIds,
  setSelectedSubmissionIds,
  calculateAdjustedAmount,
  setInputDeliveryFee,
  setInputDiscount,
  setRoundingRule,
  handleApplyFeeSplit,
  handleBatchMarkPaid,
  handleTogglePaid,
  setSignatureTarget,
  setChangeModalTarget,
  handleCopyPersonalReceipt,
  handleArchiveGroup,
}: AdminDashboardSectionProps) {
  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white rounded-3xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold flex items-center gap-2">👑 團長旗艦儀表板</h2>
          <button
            onClick={handleArchiveGroup}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded-lg text-slate-200 font-bold transition"
          >
            📦 結案歸檔
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
            <p className="text-[10px] text-slate-400 font-medium">總訂單 / 總金額</p>
            <p className="text-lg font-extrabold text-sky-400 mt-0.5">
              {submissions.length} 筆 / ${grandTotal}
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
            <p className="text-[10px] text-slate-400 font-medium">已實收進度</p>
            <p className="text-lg font-extrabold text-green-400 mt-0.5">${paidTotal} 元</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700">🔢 運費平攤設定與前後對比預覽</h3>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-bold">外送費 (+)</label>
            <input
              type="number"
              value={inputDeliveryFee}
              onChange={(e) => setInputDeliveryFee(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">折扣 (-)</label>
            <input
              type="number"
              value={inputDiscount}
              onChange={(e) => setInputDiscount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">取整規則</label>
            <select
              value={roundingRule}
              onChange={(e) => setRoundingRule(e.target.value as 'floor' | 'ceil' | 'round')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-1 text-xs font-bold"
            >
              <option value="floor">無條件捨去</option>
              <option value="ceil">無條件進位</option>
              <option value="round">四捨五入</option>
            </select>
          </div>
        </div>

        {submissions.length > 0 && (
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 space-y-1.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              算式試算對比預覽 (每人差額: ${calculateAdjustedAmount(0)} 元)
            </p>
            <div className="divide-y divide-slate-200 text-xs">
              {submissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="py-1 flex justify-between font-semibold">
                  <span className="text-slate-700">{sub.user_nickname}</span>
                  <span className="text-slate-500">
                    原價 ${sub.total_amount} ➔ <span className="text-sky-600 font-extrabold">${calculateAdjustedAmount(sub.total_amount)} 元</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleApplyFeeSplit}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-xl text-xs transition shadow-xs"
        >
          套用算式並更新全團應收金額
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700">📦 全團品項下單總數量</h3>
        <div className="space-y-1.5 divide-y divide-slate-50">
          {Object.entries(itemSummary).map(([itemName, qty]) => (
            <div key={itemName} className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1.5">
              <span className="truncate mr-2">{itemName}</span>
              <span className="bg-sky-100 text-sky-700 font-extrabold px-2 py-0.5 rounded-md shrink-0">x {qty}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">👥 團員訂單對帳清單</h3>
          <button
            type="button"
            onClick={handleBatchMarkPaid}
            className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-xl border border-green-200"
          >
            ☑️ 批次勾選已付款 ({selectedSubmissionIds.length})
          </button>
        </div>

        {submissions.map((sub) => {
          const isChecked = selectedSubmissionIds.includes(sub.id);
          return (
            <div key={sub.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedSubmissionIds([...selectedSubmissionIds, sub.id]);
                      else setSelectedSubmissionIds(selectedSubmissionIds.filter((id) => id !== sub.id));
                    }}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">{sub.user_nickname}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">#{sub.order_number} • {sub.payment_method_name}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePaid(sub.id, sub.is_paid)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    sub.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {sub.is_paid ? '✅ 已付款' : '⏳ 待付款'}
                </button>
              </div>

              <div className="space-y-1">
                {sub.order_items.map((item) => (
                  <div key={item.id} className="text-xs flex items-center justify-between text-slate-600 font-medium">
                    <span>• {item.item_name} x {item.quantity}</span>
                    <span>${item.unit_price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {sub.signature_data && (
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">核實簽名:</span>
                  <img src={sub.signature_data} alt="簽名" className="h-6 object-contain" />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSignatureTarget(sub)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                  >
                    ✍️ 簽名核實
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeModalTarget({ nickname: sub.user_nickname, amount: sub.final_amount })}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                  >
                    💵 現金找零
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPersonalReceipt(sub)}
                    className="bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-bold px-2 py-1 rounded-lg"
                  >
                    📋 私訊對帳
                  </button>
                </div>

                <span className="text-sky-600 text-sm font-extrabold">${sub.final_amount} 元</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
