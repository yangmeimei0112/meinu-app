'use client';

import { useState, useMemo } from 'react';
import { OrderSubmissionAdmin, GroupOrderAdmin, AdminViewMode } from './admin-types';
import { useDebounce } from '@/lib/useDebounce';
import AdminOrderCard from './components/AdminOrderCard';
import { AdminDashboardMetrics } from './components/dashboard/AdminDashboardMetrics';
import { AdminDashboardFilters } from './components/dashboard/AdminDashboardFilters';
import { AdminDashboardFeeSplit } from './components/dashboard/AdminDashboardFeeSplit';

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
  handleDeleteOrder: (subId: string, nickname: string, orderNumber: string) => void;
  handleBatchDeleteOrders: () => void;
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
  handleDeleteOrder,
  handleBatchDeleteOrders,
}: AdminDashboardSectionProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // 防抖搜尋
  const debouncedSearch = useDebounce(searchQuery, 180);

  // 💡 動態金流統計：根據所有訂單動態聚合各金流已收、待收與總計，免除硬編碼綁定
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; paid: number; unpaid: number; total: number }>();
    submissions.forEach((s) => {
      const pmName = (s.payment_method_name || '自訂付款').trim();
      const existing = map.get(pmName) || { name: pmName, paid: 0, unpaid: 0, total: 0 };
      if (s.is_paid) {
        existing.paid += s.final_amount;
      } else {
        existing.unpaid += s.final_amount;
      }
      existing.total += s.final_amount;
      map.set(pmName, existing);
    });
    return Array.from(map.values());
  }, [submissions]);

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

  const isAllSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((sub) => selectedSubmissionIds.includes(sub.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredSubmissions.map((s) => s.id));
      setSelectedSubmissionIds(selectedSubmissionIds.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedSubmissionIds);
      filteredSubmissions.forEach((s) => newSelected.add(s.id));
      setSelectedSubmissionIds(Array.from(newSelected));
    }
  };

  const isDesktop = viewMode === 'desktop';

  return (
    <div className="space-y-6">
      {/* 👑 頂部指標與活動卡片 (Commander Banner + Bento Metrics + Dynamic Payment Cards) */}
      <AdminDashboardMetrics
        groupOrder={groupOrder}
        activeGroups={activeGroups}
        selectedActiveGroupId={selectedActiveGroupId}
        onSelectActiveGroup={onSelectActiveGroup}
        grandTotal={grandTotal}
        paidTotal={paidTotal}
        submissionsCount={submissions.length}
        totalItemCount={totalItemCount}
        unpaidSubmissionsCount={unpaidSubmissionsCount}
        paymentBreakdown={paymentBreakdown}
        handleToggleGroupStatus={handleToggleGroupStatus}
        handleOpenGroupSettingsModal={handleOpenGroupSettingsModal}
        handleArchiveGroup={handleArchiveGroup}
        handleExportOrdersCSV={handleExportOrdersCSV}
        handleCopyUnpaidReminder={handleCopyUnpaidReminder}
        handleOpenPrintModal={handleOpenPrintModal}
        handleOpenManualOrderModal={handleOpenManualOrderModal}
      />

      {/* 依版面模式呈現雙欄或單欄 (Desktop: 左 5 叫餐/平攤 + 右 7 訂單卡片; Mobile: 單欄) */}
      <div className={`grid gap-6 ${isDesktop ? 'grid-cols-12' : 'grid-cols-1'}`}>
        {/* 👈 左側欄：店家報單總表 (暖拿鐵調) + 運費平攤試算器 (科技藍紫調) */}
        <div className={isDesktop ? 'col-span-5 space-y-6' : 'space-y-6'}>
          <AdminDashboardFeeSplit
            totalItemCount={totalItemCount}
            itemSummary={itemSummary}
            handleCopyStoreOrderText={handleCopyStoreOrderText}
            submissions={submissions}
            inputDeliveryFee={inputDeliveryFee}
            inputDiscount={inputDiscount}
            roundingRule={roundingRule}
            setInputDeliveryFee={setInputDeliveryFee}
            setInputDiscount={setInputDiscount}
            setRoundingRule={setRoundingRule}
            calculateAdjustedAmount={calculateAdjustedAmount}
            handleApplyFeeSplit={handleApplyFeeSplit}
          />
        </div>

        {/* 👉 右側欄：團員訂單對帳流水席清單 */}
        <div className={isDesktop ? 'col-span-7 space-y-4' : 'space-y-4'}>
          {submissions.length === 0 ? (
            <div className="bg-white/90 dark:bg-[#0E1726]/90 rounded-3xl p-8 sm:p-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="text-4xl">📭</div>
              <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">目前尚無團員送單</h4>
              <p className="text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
                此團購活動目前還沒有收到任何訂單。您可以點擊上方「➕ 幫朋友代點」由團長手動補單，或分享專屬點餐網址給朋友！
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenManualOrderModal}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>➕ 幫朋友代點</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* 頂部搜尋、篩選與批次工具列 */}
              <AdminDashboardFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                unpaidCount={unpaidSubmissionsCount}
                paidCount={paidSubmissionsCount}
                totalFilteredCount={filteredSubmissions.length}
                selectedCount={selectedSubmissionIds.length}
                isAllSelected={isAllSelected}
                handleToggleSelectAll={handleToggleSelectAll}
                handleBatchMarkPaid={handleBatchMarkPaid}
                handleBatchDeleteOrders={handleBatchDeleteOrders}
              />

              {/* 訂單卡片列表 */}
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => (
                  <AdminOrderCard
                    key={sub.id}
                    sub={sub}
                    isChecked={selectedSubmissionIds.includes(sub.id)}
                    onToggleSelect={(subId, checked) => {
                      if (checked) {
                        setSelectedSubmissionIds([...selectedSubmissionIds, subId]);
                      } else {
                        setSelectedSubmissionIds(selectedSubmissionIds.filter((id) => id !== subId));
                      }
                    }}
                    onTogglePaid={handleTogglePaid}
                    onSetSignatureTarget={setSignatureTarget}
                    onSetChangeModalTarget={setChangeModalTarget}
                    onCopyPersonalReceipt={handleCopyPersonalReceipt}
                    onDeleteOrder={handleDeleteOrder}
                  />
                ))}

                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-[#0E1726]/80 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                    沒有符合「{searchQuery}」篩選條件的訂單
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
