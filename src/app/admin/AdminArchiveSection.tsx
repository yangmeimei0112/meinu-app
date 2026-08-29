'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, AdminViewMode, OrderSubmissionAdmin } from './admin-types';
import { Archive } from 'lucide-react';
import { AdminArchiveFilters } from './components/archive/AdminArchiveFilters';
import { AdminArchiveCard } from './components/archive/AdminArchiveCard';

interface AdminArchiveSectionProps {
  viewMode?: AdminViewMode;
  archivedGroups: GroupOrderAdmin[];
  selectedArchivedGroupId: string | null;
  setSelectedArchivedGroupId: (value: string | null) => void;
  handleReopenGroup: (group: GroupOrderAdmin) => void;
  handleDeleteArchivedGroup: (groupId: string, title: string) => void;
  handleBatchDeleteArchivedGroups: (groupIds: string[]) => void;
}

export function AdminArchiveSection({
  archivedGroups,
  selectedArchivedGroupId,
  setSelectedArchivedGroupId,
  handleReopenGroup,
  handleDeleteArchivedGroup,
  handleBatchDeleteArchivedGroups,
}: AdminArchiveSectionProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupOrdersMap, setGroupOrdersMap] = useState<Record<string, OrderSubmissionAdmin[]>>({});
  const [loadingOrdersGroupId, setLoadingOrdersGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 篩選歷史活動
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return archivedGroups;
    return archivedGroups.filter((g) => {
      const titleMatch = g.title.toLowerCase().includes(q);
      const storeMatch = g.stores?.name?.toLowerCase().includes(q);
      const announcementMatch = g.announcement?.toLowerCase().includes(q);
      return titleMatch || storeMatch || announcementMatch;
    });
  }, [archivedGroups, searchQuery]);

  const isAllSelected =
    filteredGroups.length > 0 && selectedGroupIds.length === filteredGroups.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredGroups.map((g) => g.id));
    }
  };

  const handleToggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBatchDelete = () => {
    if (selectedGroupIds.length === 0) return;
    handleBatchDeleteArchivedGroups(selectedGroupIds);
    setSelectedGroupIds([]);
  };

  // 載入指定歷史團購的訂單明細
  const handleToggleExpandOrders = async (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      return;
    }

    setExpandedGroupId(groupId);
    setSelectedArchivedGroupId(groupId);

    // 若尚未載入過該團訂單，則由 Supabase 抓取
    if (!groupOrdersMap[groupId]) {
      setLoadingOrdersGroupId(groupId);
      try {
        const { data, error } = await supabase
          .from('order_submissions')
          .select(`
            id, order_number, user_nickname, payment_method_name, sold_out_option,
            total_amount, final_amount, is_paid, signature_data, created_at, group_order_id,
            order_items (id, item_name, quantity, unit_price, custom_notes)
          `)
          .eq('group_order_id', groupId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formatted: OrderSubmissionAdmin[] = (data || []).map((s: any) => ({
          ...s,
          order_items: s.order_items || [],
        }));

        setGroupOrdersMap((prev) => ({ ...prev, [groupId]: formatted }));
      } catch (err) {
        console.error('載入歷史訂單失敗:', err);
      } finally {
        setLoadingOrdersGroupId(null);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* 👑 頂部標題列與篩選列 */}
      <AdminArchiveFilters
        totalCount={archivedGroups.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isAllSelected={isAllSelected}
        selectedCount={selectedGroupIds.length}
        onToggleSelectAll={handleToggleSelectAll}
        onExecuteBatchDelete={handleExecuteBatchDelete}
      />

      {archivedGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0E1726]/90 p-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-3">
          <Archive className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
          <p className="font-extrabold text-slate-700 dark:text-slate-200 text-sm">目前尚無已結案的封存團購活動</p>
          <p>當進行中的團購活動結案歸檔後，將會在此處保存備查。</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0E1726]/90 p-8 text-center text-xs text-slate-400">
          找不到符合「{searchQuery}」的歷史活動紀錄
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <AdminArchiveCard
              key={group.id}
              group={group}
              isChecked={selectedGroupIds.includes(group.id)}
              isExpanded={expandedGroupId === group.id}
              isSelected={selectedArchivedGroupId === group.id}
              orders={groupOrdersMap[group.id] || []}
              isLoadingOrders={loadingOrdersGroupId === group.id}
              onToggleSelectItem={handleToggleSelectItem}
              onToggleExpandOrders={handleToggleExpandOrders}
              onReopenGroup={handleReopenGroup}
              onDeleteGroup={handleDeleteArchivedGroup}
            />
          ))}
        </div>
      )}
    </div>
  );
}
