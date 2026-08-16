'use client';

import { useState, useMemo } from 'react';
import { OrderSubmissionAdmin, GroupOrderAdmin, AdminViewMode } from './admin-types';
import { useDebounce } from '@/lib/useDebounce';

interface AdminDashboardSectionProps {
  viewMode?: AdminViewMode;
  groupOrder: GroupOrderAdmin | null;
  activeGroups?: GroupOrderAdmin[];
  selectedActiveGroupId?: string;
  onSelectActiveGroup?: (groupId: string) => void;
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
  handleCopyStoreOrderText: () => void;
  handleCopyUnpaidReminder: () => void;
  handleExportOrdersCSV: () => void;
  handleOpenPrintModal: () => void;
  handleOpenManualOrderModal: () => void;
  handleOpenGroupSettingsModal?: () => void;
  handleArchiveGroup: () => void;
  handleToggleGroupStatus: (newStatus: 'open' | 'closed') => void;
}

export function AdminDashboardSection({
  viewMode = 'desktop',
  groupOrder,
  activeGroups = [],
  selectedActiveGroupId = 'all',
  onSelectActiveGroup,
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
  handleCopyStoreOrderText,
  handleCopyUnpaidReminder,
  handleExportOrdersCSV,
  handleOpenPrintModal,
  handleOpenManualOrderModal,
  handleOpenGroupSettingsModal,
  handleArchiveGroup,
  handleToggleGroupStatus,
}: AdminDashboardSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // 防抖搜尋
  const debouncedSearch = useDebounce(searchQuery, 180);

  // 記憶化各金流分類實收與待收
  const { cashPaid, cashUnpaid, linePayPaid, linePayUnpaid, transferPaid, transferUnpaid } = useMemo(() => {
    let cPaid = 0, cUnpaid = 0;
    let lPaid = 0, lUnpaid = 0;
    let tPaid = 0, tUnpaid = 0;

    submissions.forEach((s) => {
      const name = s.payment_method_name.toLowerCase();
      if (name.includes('現金')) {
        if (s.is_paid) cPaid += s.final_amount;
        else cUnpaid += s.final_amount;
      } else if (name.includes('line')) {
        if (s.is_paid) lPaid += s.final_amount;
        else lUnpaid += s.final_amount;
      } else {
        if (s.is_paid) tPaid += s.final_amount;
        else tUnpaid += s.final_amount;
      }
    });

    return {
      cashPaid: cPaid,
      cashUnpaid: cUnpaid,
      linePayPaid: lPaid,
      linePayUnpaid: lUnpaid,
      transferPaid: tPaid,
      transferUnpaid: tUnpaid,
    };
  }, [submissions]);

  const isClosed = groupOrder?.status === 'closed';
  const totalItemCount = useMemo(() => Object.values(itemSummary).reduce((a, b) => a + b, 0), [itemSummary]);
  const unpaidSubmissionsCount = useMemo(() => submissions.filter((s) => !s.is_paid).length, [submissions]);
  const paidSubmissionsCount = useMemo(() => submissions.filter((s) => s.is_paid).length, [submissions]);

  // 記憶化過濾團員清單
  const filteredSubmissions = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return submissions.filter((sub) => {
      const matchesSearch =
        !query ||
        sub.user_nickname.toLowerCase().includes(query) ||
        sub.order_number.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (statusFilter === 'unpaid') return !sub.is_paid;
      if (statusFilter === 'paid') return sub.is_paid;
      return true;
    });
  }, [submissions, debouncedSearch, statusFilter]);

  const isDesktop = viewMode === 'desktop';

  // 1. 向店家報單彙總清單組件
  const StoreSummaryCard = (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <span>📦 向店家下單總表</span>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              共 {totalItemCount} 份
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">向店家電話/LINE 叫餐報單專用清單</p>
        </div>

        <button
          type="button"
          onClick={handleCopyStoreOrderText}
          className="bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-100 transition active:scale-95 flex items-center gap-1"
        >
          <span>📋 複製報單文字</span>
        </button>
      </div>

      <div className="space-y-1.5 divide-y divide-slate-50 max-h-[360px] overflow-y-auto pr-1">
        {Object.entries(itemSummary).map(([itemName, qty], idx) => (
          <div key={itemName} className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-2">
            <div className="flex items-center gap-2 truncate mr-2">
              <span className="text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
              <span className="truncate">{itemName}</span>
            </div>
            <span className="bg-sky-100 text-sky-800 font-black px-2.5 py-0.5 rounded-lg shrink-0 text-xs">
              x {qty}
            </span>
          </div>
        ))}
        {Object.keys(itemSummary).length === 0 && (
          <p className="text-center py-6 text-xs text-slate-400">目前尚無點餐資料</p>
        )}
      </div>
    </div>
  );

  // 2. 運費平攤算式設定組件
  const FeeSplitCard = (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <span>🔢 運費與折扣平攤設定</span>
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">即時試算每人金額</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-slate-400 font-bold">外送費 (+)</label>
          <input
            type="number"
            value={inputDeliveryFee}
            onChange={(e) => setInputDeliveryFee(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 font-bold">折扣 (-)</label>
          <input
            type="number"
            value={inputDiscount}
            onChange={(e) => setInputDiscount(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-400 font-bold">取整規則</label>
          <select
            value={roundingRule}
            onChange={(e) => setRoundingRule(e.target.value as 'floor' | 'ceil' | 'round')}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="floor">無條件捨去</option>
            <option value="ceil">無條件進位</option>
            <option value="round">四捨五入</option>
          </select>
        </div>
      </div>

      {submissions.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-1.5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            試算對比預覽 (每人差額: ${calculateAdjustedAmount(0)} 元)
          </p>
          <div className="divide-y divide-slate-200 text-xs">
            {submissions.slice(0, 3).map((sub) => (
              <div key={sub.id} className="py-1 flex justify-between font-semibold">
                <span className="text-slate-700 truncate mr-2">{sub.user_nickname}</span>
                <span className="text-slate-500 shrink-0">
                  原價 ${sub.total_amount} ➔{' '}
                  <span className="text-sky-600 font-extrabold">
                    ${calculateAdjustedAmount(sub.total_amount)} 元
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleApplyFeeSplit}
        className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-95"
      >
        套用平攤算式並更新全團應收金額
      </button>
    </div>
  );

  // 3. 團員對帳清單組件
  const MemberOrdersCard = submissions.length === 0 ? (
    <div className="bg-white rounded-3xl p-8 sm:p-12 text-center text-slate-400 text-xs border border-slate-100 shadow-xs space-y-3">
      <div className="text-4xl">📭</div>
      <h4 className="text-sm font-extrabold text-slate-700">目前尚無團員送單</h4>
      <p className="text-slate-400 max-w-xs mx-auto">
        此團購活動目前還沒有收到任何訂單。您可以點擊上方「➕ 幫朋友代點」由團長手動補單，或分享專屬點餐網址給朋友！
      </p>
      <div className="pt-2 flex justify-center gap-2">
        <button
          type="button"
          onClick={handleOpenManualOrderModal}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5"
        >
          <span>➕ 幫朋友代點</span>
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-3.5">
      {/* 頂部搜尋、篩選與批次勾選列 */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span>👥 團員訂單對帳清單</span>
              <span className="text-xs text-slate-400 font-bold">
                ({filteredSubmissions.length} / {submissions.length} 筆)
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedSubmissionIds.length === 0}
              onClick={handleBatchMarkPaid}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition active:scale-95 disabled:opacity-40"
            >
              ☑️ 批次標記已付款 ({selectedSubmissionIds.length})
            </button>
          </div>
        </div>

        {/* 搜尋與狀態過濾器 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 搜尋團員暱稱或單號..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-3 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              全部 ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unpaid')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'unpaid' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              ⏳ 待付款 ({unpaidSubmissionsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg transition ${
                statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              ✅ 已付款 ({paidSubmissionsCount})
            </button>
          </div>
        </div>
      </div>

      {/* 訂單卡片列表 */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="font-bold text-slate-600">找不到符合條件的訂單</p>
          <p className="text-slate-400">請嘗試更改搜尋關鍵字或切換篩選標籤。</p>
        </div>
      ) : (
        <div className={isDesktop ? 'grid grid-cols-1 xl:grid-cols-2 gap-3' : 'space-y-3'}>
          {filteredSubmissions.map((sub) => {
            const isChecked = selectedSubmissionIds.includes(sub.id);
            return (
              <div
                key={sub.id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3 transition hover:border-slate-300"
              >
                {/* 頂部姓名、單號與付款切換 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedSubmissionIds([...selectedSubmissionIds, sub.id]);
                        else
                          setSelectedSubmissionIds(
                            selectedSubmissionIds.filter((id) => id !== sub.id)
                          );
                      }}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-slate-800 text-base truncate">
                          {sub.user_nickname}
                        </h4>
                        {sub.store_name && (
                          <span className="bg-sky-50 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-sky-100">
                            {sub.store_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        #{sub.order_number} • {sub.payment_method_name}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePaid(sub.id, sub.is_paid)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 shrink-0 ${
                      sub.is_paid
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200 animate-pulse'
                    }`}
                  >
                    {sub.is_paid ? '✅ 已付款' : '⏳ 待付款'}
                  </button>
                </div>

                {/* 餐點明細 */}
                <div className="space-y-1">
                  {(sub.order_items || []).map((item) => (
                    <div
                      key={item.id}
                      className="text-xs flex items-start justify-between text-slate-600 font-medium"
                    >
                      <div>
                        <span>• {item.item_name} x {item.quantity}</span>
                        {item.custom_notes && (
                          <p className="text-[10px] text-slate-400 pl-2">{item.custom_notes}</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-700 shrink-0">
                        ${item.unit_price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 缺貨備案提示 */}
                {sub.sold_out_option && (
                  <div className="text-[10px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                    <span className="font-bold text-slate-700">缺貨處理：</span>
                    {sub.sold_out_option}
                  </div>
                )}

                {/* 數位簽名預覽 */}
                {sub.signature_data && (
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">核實簽名:</span>
                    <img src={sub.signature_data} alt="簽名" className="h-6 object-contain" />
                  </div>
                )}

                {/* 底部功能捷徑與總額 */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSignatureTarget(sub)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-xl transition active:scale-95"
                    >
                      ✍️ 簽名
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setChangeModalTarget({
                          nickname: sub.user_nickname,
                          amount: sub.final_amount,
                        })
                      }
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-xl transition active:scale-95"
                    >
                      💵 找零試算
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPersonalReceipt(sub)}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold px-2.5 py-1 rounded-xl transition active:scale-95"
                    >
                      📋 私訊催款
                    </button>
                  </div>

                  <span className="text-sky-600 text-base font-extrabold">
                    ${sub.final_amount} 元
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 🏬 多店家/多團購活動即時切換導覽列 */}
      {activeGroups && activeGroups.length > 1 && (
        <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0 px-2 text-xs font-extrabold text-slate-500">
            <span>🏬 進行中團購：</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => onSelectActiveGroup && onSelectActiveGroup('all')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                selectedActiveGroupId === 'all'
                  ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>✨ 全部活動訂單</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedActiveGroupId === 'all'
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {activeGroups.reduce((sum, g) => sum + (g.order_count || 0), 0)}
              </span>
            </button>

            {activeGroups.map((g) => {
              const isSelected = selectedActiveGroupId === g.id;
              const storeName = g.stores?.name || g.title;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectActiveGroup && onSelectActiveGroup(g.id)}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold transition shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{storeName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {g.order_count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 團長旗艦儀表板頂部卡片 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <span>👑 團長旗艦儀表板</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              活動狀態：
              <span className={`font-bold ml-1 ${isClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isClosed ? '🔒 已截單 (停止收單)' : '🟢 開放點餐中'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {handleOpenGroupSettingsModal && (
              <button
                type="button"
                onClick={handleOpenGroupSettingsModal}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 rounded-xl text-sky-300 font-bold transition active:scale-95 flex items-center gap-1"
              >
                <span>⚙️ 團購進階設定</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleToggleGroupStatus(isClosed ? 'open' : 'closed')}
              className={`text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-xs active:scale-95 ${
                isClosed
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {isClosed ? '🔓 重新開放收單' : '🔒 截單 (停止收單)'}
            </button>

            <button
              type="button"
              onClick={handleArchiveGroup}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 rounded-xl text-slate-200 font-bold transition active:scale-95"
            >
              📦 結案歸檔
            </button>
          </div>
        </div>

        {/* 總覽數據卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 space-y-0.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">總訂單 / 份數</p>
            <p className="text-lg sm:text-xl font-black text-sky-400">
              {submissions.length} 筆 / {totalItemCount} 份
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 space-y-0.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">全團總金額</p>
            <p className="text-lg sm:text-xl font-black text-sky-300">${grandTotal} 元</p>
          </div>
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 space-y-0.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">已實收金額</p>
            <p className="text-lg sm:text-xl font-black text-emerald-400">${paidTotal} 元</p>
          </div>
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 space-y-0.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">待收款餘額</p>
            <p className="text-lg sm:text-xl font-black text-amber-400">
              ${Math.max(0, grandTotal - paidTotal)} 元
            </p>
          </div>
        </div>

        {/* 💵 分類金流收支統計 */}
        <div className="bg-slate-800/60 rounded-2xl p-3 sm:p-4 border border-slate-700/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 font-bold">💵 現金收款</p>
            <p className="font-extrabold text-emerald-400 text-sm sm:text-base">${cashPaid}</p>
            <p className="text-[9px] text-slate-400">待收: ${cashUnpaid}</p>
          </div>
          <div className="space-y-0.5 border-x border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-bold">💚 LINE Pay</p>
            <p className="font-extrabold text-emerald-400 text-sm sm:text-base">${linePayPaid}</p>
            <p className="text-[9px] text-slate-400">待收: ${linePayUnpaid}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400 font-bold">💳 銀行轉帳</p>
            <p className="font-extrabold text-emerald-400 text-sm sm:text-base">${transferPaid}</p>
            <p className="text-[9px] text-slate-400">待收: ${transferUnpaid}</p>
          </div>
        </div>

        {/* 常用捷徑操作按鈕群 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <button
            type="button"
            onClick={handleOpenManualOrderModal}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2 rounded-xl transition active:scale-95 shadow-xs flex items-center justify-center gap-1"
          >
            <span>➕ 幫朋友代點</span>
          </button>

          <button
            type="button"
            onClick={handleCopyStoreOrderText}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
          >
            <span>📋 複製下單文字</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUnpaidReminder}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
          >
            <span>📢 一鍵群組催款</span>
          </button>

          <button
            type="button"
            onClick={handleExportOrdersCSV}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-bold text-xs py-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
          >
            <span>📊 匯出訂單 CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPrintModal}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-bold text-xs py-2 rounded-xl transition active:scale-95 col-span-2 sm:col-span-1 flex items-center justify-center gap-1"
          >
            <span>🖨️ 友善列印檢視</span>
          </button>
        </div>
      </div>

      {/* 主內容區：根據 viewMode 切換多欄 (Desktop) 或單欄堆疊 (Mobile) */}
      {isDesktop ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* 左欄 (5/12 寬度): 📦 店家下單總表 + 🔢 運費平攤設定 */}
          <div className="lg:col-span-5 space-y-5">
            {StoreSummaryCard}
            {FeeSplitCard}
          </div>

          {/* 右欄 (7/12 寬度): 👥 團員訂單對帳清單 */}
          <div className="lg:col-span-7">
            {MemberOrdersCard}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {FeeSplitCard}
          {StoreSummaryCard}
          {MemberOrdersCard}
        </div>
      )}
    </div>
  );
}
