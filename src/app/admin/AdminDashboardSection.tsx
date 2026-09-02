'use client';

import { useState, useMemo } from 'react';
import { OrderSubmissionAdmin, GroupOrderAdmin, AdminViewMode } from './admin-types';
import { useDebounce } from '@/lib/useDebounce';
import AdminOrderCard from './components/AdminOrderCard';
import { AdminDashboardMetrics } from './components/dashboard/AdminDashboardMetrics';
import { AdminDashboardFilters } from './components/dashboard/AdminDashboardFilters';
import { AdminDashboardFeeSplit } from './components/dashboard/AdminDashboardFeeSplit';
import { OrderProgressStatus } from '@/types/orderStatus';
import { Inbox, Plus } from 'lucide-react';

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
  handleUpdateProgressStatus?: (subId: string, newStatus: OrderProgressStatus) => void;
  handleBatchUpdateProgressStatus?: (newStatus: OrderProgressStatus) => void;
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
  handleUpdateProgressStatus,
  handleBatchUpdateProgressStatus,
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
  const [progressFilter, setProgressFilter] = useState<'all' | OrderProgressStatus>('all');

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

      // 付款狀態篩選
      if (statusFilter === 'unpaid' && sub.is_paid) return false;
      if (statusFilter === 'paid' && !sub.is_paid) return false;

      // 進度狀態篩選
      if (progressFilter !== 'all') {
        const subProgress = sub.progress_status || 'pending';
        if (subProgress !== progressFilter) return false;
      }

      return true;
    });
  }, [submissions, debouncedSearch, statusFilter, progressFilter]);

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
    <div className="space-y-4">
      {/* 頂部數據統計與操作列 */}
      <AdminDashboardMetrics
        groupOrder={groupOrder}
        activeGroups={activeGroups}
        selectedActiveGroupId={selectedActiveGroupId}
        onSelectActiveGroup={onSelectActiveGroup}
        submissionsCount={submissions.length}
        totalItemCount={totalItemCount}
        unpaidSubmissionsCount={unpaidSubmissionsCount}
        paidTotal={paidTotal}
        grandTotal={grandTotal}
        paymentBreakdown={paymentBreakdown}
        handleOpenPrintModal={handleOpenPrintModal}
        handleOpenManualOrderModal={handleOpenManualOrderModal}
        handleOpenGroupSettingsModal={handleOpenGroupSettingsModal}
        handleArchiveGroup={handleArchiveGroup}
        handleToggleGroupStatus={handleToggleGroupStatus}
        handleCopyUnpaidReminder={handleCopyUnpaidReminder}
        handleExportOrdersCSV={handleExportOrdersCSV}
      />

      {/* 兩欄/單欄響應式排版 */}
      <div className={`grid gap-4 ${isDesktop ? 'grid-cols-12 items-start' : 'grid-cols-1'}`}>
        {/* 左側平攤試算器 */}
        <div className={isDesktop ? 'col-span-4 sticky top-4' : 'w-full'}>
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

        {/* 右側訂單明細與卡片清單 */}
        <div className={isDesktop ? 'col-span-8' : 'w-full'}>
          {submissions.length === 0 ? (
            <div className="bg-white/90 dark:bg-[#0E1726]/90 rounded-3xl p-10 text-center border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] space-y-3 backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/80 text-sky-500 mx-auto flex items-center justify-center border border-sky-100 dark:border-sky-800/80">
                <Inbox className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">目前尚無點餐資料</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  團員送出訂單後，將會即時在此處自動更新並推播提醒！
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenManualOrderModal}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>幫朋友代點</span>
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
                progressFilter={progressFilter}
                setProgressFilter={setProgressFilter}
                unpaidCount={unpaidSubmissionsCount}
                paidCount={paidSubmissionsCount}
                totalFilteredCount={filteredSubmissions.length}
                selectedCount={selectedSubmissionIds.length}
                isAllSelected={isAllSelected}
                handleToggleSelectAll={handleToggleSelectAll}
                handleBatchMarkPaid={handleBatchMarkPaid}
                handleBatchUpdateProgress={handleBatchUpdateProgressStatus}
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
                    onUpdateProgressStatus={handleUpdateProgressStatus}
                    onSetSignatureTarget={setSignatureTarget}
                    onSetChangeModalTarget={setChangeModalTarget}
                    onCopyPersonalReceipt={handleCopyPersonalReceipt}
                    onDeleteOrder={handleDeleteOrder}
                  />
                ))}

                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-[#0E1726]/80 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                    沒有符合篩選條件的訂單
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
