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
      {/* 頂部指標與活動卡片 */}
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
        cashPaid={cashPaid}
        cashUnpaid={cashUnpaid}
        linePayPaid={linePayPaid}
        linePayUnpaid={linePayUnpaid}
        transferPaid={transferPaid}
        transferUnpaid={transferUnpaid}
        handleToggleGroupStatus={handleToggleGroupStatus}
        handleOpenGroupSettingsModal={handleOpenGroupSettingsModal}
        handleArchiveGroup={handleArchiveGroup}
        handleExportOrdersCSV={handleExportOrdersCSV}
        handleCopyUnpaidReminder={handleCopyUnpaidReminder}
        handleOpenPrintModal={handleOpenPrintModal}
        handleOpenManualOrderModal={handleOpenManualOrderModal}
      />

      {/* 依版面模式呈現雙欄或單欄 (Desktop: 左報單/平攤 + 右訂單卡片; Mobile: 單欄) */}
      <div className={`grid gap-6 ${isDesktop ? 'grid-cols-12' : 'grid-cols-1'}`}>
        {/* 左側欄：店家報單總表 + 運費平攤試算器 */}
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

        {/* 右側欄：團員訂單對帳清單 */}
        <div className={isDesktop ? 'col-span-7 space-y-4' : 'space-y-4'}>
          {submissions.length === 0 ? (
            <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-8 sm:p-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-slate-100 dark:border-slate-800 shadow-xs space-y-3">
              <div className="text-4xl">📭</div>
              <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">目前尚無團員送單</h4>
              <p className="text-slate-400 dark:text-slate-400 max-w-xs mx-auto">
                此團購活動目前還沒有收到任何訂單。您可以點擊上方「➕ 幫朋友代點」由團長手動補單，或分享專屬點餐網址給朋友！
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenManualOrderModal}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
                  <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-[#131B2B] rounded-3xl border border-slate-100 dark:border-slate-800">
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
