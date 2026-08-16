'use client';

import { OrderSubmissionAdmin, GroupOrderAdmin } from './admin-types';

interface AdminPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupOrder: GroupOrderAdmin | null;
  submissions: OrderSubmissionAdmin[];
  itemSummary: Record<string, number>;
  grandTotal: number;
}

export default function AdminPrintModal({
  isOpen,
  onClose,
  groupOrder,
  submissions,
  itemSummary,
  grandTotal,
}: AdminPrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalItemCount = Object.values(itemSummary).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] flex flex-col">
        {/* 頂部操作欄（列印時隱藏） */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">友善列印檢視</h3>
              <p className="text-xs text-slate-400">紙本對帳與向店家下單明細總表</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
            >
              <span>🖨️ 立即列印</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 列印內容區域 */}
        <div className="flex-1 overflow-y-auto space-y-6 text-slate-800 p-2">
          <div className="space-y-6">
            {/* 報表表頭 */}
            <div className="border-b-2 border-slate-900 pb-3">
              <h1 className="text-xl font-black text-slate-900">
                【咩nu】{groupOrder?.title || '團購訂單明細總表'}
              </h1>
              <div className="flex justify-between text-xs text-slate-500 mt-1 font-semibold">
                <span>列印時間：{new Date().toLocaleString('zh-TW')}</span>
                <span>總計：{submissions.length} 筆訂單 / {totalItemCount} 份餐點 / ${grandTotal} 元</span>
              </div>
            </div>

            {/* 1. 向店家下單彙總表 */}
            <div className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                📦 1. 向店家下單品項彙總清單 (共 {totalItemCount} 份)
              </h2>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-12 text-center">序號</th>
                    <th className="p-2 border-r border-slate-200">餐點名稱與客製規格</th>
                    <th className="p-2 text-right w-20">數量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(itemSummary).map(([name, qty], idx) => (
                    <tr key={name} className="hover:bg-slate-50/50">
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{name}</td>
                      <td className="p-2 text-right font-black text-sm text-sky-700">x {qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. 個人對帳明細表 */}
            <div className="space-y-2 pt-2">
              <h2 className="text-sm font-extrabold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                👥 2. 個人對帳與收費明細表 (共 {submissions.length} 人)
              </h2>
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-24">單號 / 姓名</th>
                    <th className="p-2 border-r border-slate-200">點餐明細</th>
                    <th className="p-2 border-r border-slate-200 w-20 text-center">付款方式</th>
                    <th className="p-2 border-r border-slate-200 w-16 text-right">應收金額</th>
                    <th className="p-2 w-16 text-center">狀態/簽名</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="p-2 border-r border-slate-200 align-top">
                        <p className="font-extrabold text-slate-800">{sub.user_nickname}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{sub.order_number}</p>
                      </td>
                      <td className="p-2 border-r border-slate-200 align-top space-y-0.5">
                        {(sub.order_items || []).map((i) => (
                          <div key={i.id} className="text-[11px] text-slate-700">
                            <span>• {i.item_name} x {i.quantity}</span>
                            {i.custom_notes && (
                              <span className="text-slate-400 text-[10px] ml-1">({i.custom_notes})</span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center align-top text-[11px]">
                        {sub.payment_method_name}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right align-top font-bold text-slate-900">
                        ${sub.final_amount}
                      </td>
                      <td className="p-2 text-center align-top text-[11px] font-bold">
                        {sub.is_paid ? (
                          <span className="text-emerald-700">已付</span>
                        ) : (
                          <span className="text-amber-600">未付</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
