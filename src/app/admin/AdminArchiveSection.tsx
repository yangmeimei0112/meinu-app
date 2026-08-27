'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, AdminViewMode, OrderSubmissionAdmin } from './admin-types';
import {
  Archive,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Check,
  Store as StoreIcon,
  Package,
  Megaphone,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

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
  viewMode = 'desktop',
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

  const isDesktop = viewMode === 'desktop';

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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* 👑 頂部標題列與操作列 (Archive Commander Header) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-100/90 via-white/95 to-sky-50/80 dark:from-[#0B1324] dark:via-[#0D172E] dark:to-[#111A38] rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-sky-500/30 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] space-y-4">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-slate-400 via-sky-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
          <div>
            <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Archive className="w-5 h-5 text-sky-500" />
              <span>歷史團購活動歸檔</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 px-3 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs">
                共 {archivedGroups.length} 個歷史活動
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
              過去已結案的歷史團購活動紀錄，點擊可展開查看歷史訂單明細，亦可一鍵複製重開新團或清理過期紀錄。
            </p>
          </div>

          {/* 搜尋與全選/批次刪除工具列 */}
          <div className="flex items-center gap-2 flex-wrap">
            {archivedGroups.length > 0 && (
              <>
                {/* 搜尋輸入框 */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="搜尋歷史活動或店家..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white dark:bg-[#152033] border border-slate-200 dark:border-slate-700 rounded-2xl py-2 pl-8 pr-3 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className={`text-xs px-3.5 py-2 rounded-2xl font-black transition flex items-center gap-1.5 border active:scale-95 cursor-pointer shadow-2xs ${
                    isAllSelected
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-500'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>取消全選</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>全選</span>
                    </>
                  )}
                </button>

                {selectedGroupIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExecuteBatchDelete}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs px-4 py-2 rounded-2xl font-black transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer animate-in fade-in duration-150"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>批次刪除 ({selectedGroupIds.length})</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
          {filteredGroups.map((group) => {
            const isChecked = selectedGroupIds.includes(group.id);
            const isExpanded = expandedGroupId === group.id;
            const orders = groupOrdersMap[group.id] || [];
            const isLoadingOrders = loadingOrdersGroupId === group.id;

            // 計算該歷史團訂單統計
            const totalOrders = orders.length;
            const totalSales = orders.reduce((sum, o) => sum + o.final_amount, 0);
            const paidCount = orders.filter((o) => o.is_paid).length;

            return (
              <div
                key={group.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md ${
                  isChecked
                    ? 'border-sky-400 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-300 dark:ring-sky-700/60'
                    : selectedArchivedGroupId === group.id
                    ? 'border-sky-300 dark:border-sky-500 bg-white/95 dark:bg-[#0E1726]/95'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0E1726]/95 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* 歷史團購活動卡片頭部資訊 */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3.5">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* 核取方塊 */}
                      <button
                        type="button"
                        aria-label={`選取歷史活動 ${group.title}`}
                        onClick={(e) => handleToggleSelectItem(group.id, e)}
                        className={`w-5 h-5 mt-1 rounded-lg border flex items-center justify-center text-[10px] font-black transition shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-sky-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 店家標籤 */}
                          <span className="text-[11px] font-black bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 px-3 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60 flex items-center gap-1">
                            <StoreIcon className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                            <span>{group.stores?.name || '合作門市'}</span>
                          </span>

                          {/* 狀態標籤 */}
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span>已結案歸檔</span>
                          </span>
                        </div>

                        {/* 活動標題 */}
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                          {group.title}
                        </h4>

                        {/* 公告 */}
                        {group.announcement && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic flex items-center gap-1">
                            <Megaphone className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{group.announcement}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 操作功能按鈕群 */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {/* 重開此團 */}
                      <button
                        type="button"
                        onClick={() => handleReopenGroup(group)}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>一鍵重開新團</span>
                      </button>

                      {/* 展開明細按鈕 */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleExpandOrders(group.id, e)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-black border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isExpanded
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-transparent'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>收合名單</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>查看訂單</span>
                          </>
                        )}
                      </button>

                      {/* 單筆刪除 */}
                      <button
                        type="button"
                        onClick={() => handleDeleteArchivedGroup(group.id, group.title)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-black text-xs w-8 h-8 rounded-xl border border-slate-200/60 dark:border-slate-700 transition cursor-pointer flex items-center justify-center"
                        title="刪除此活動紀錄"
                        aria-label="刪除此活動紀錄"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 展開之歷史訂單流水席 */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#152033]/80 p-4 sm:p-5 space-y-4">
                    {isLoadingOrders ? (
                      <div className="text-center py-6 text-xs text-slate-400 animate-pulse">
                        正在載入歷史訂單名單...
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        此活動當時無任何送單紀錄
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-black text-slate-600 dark:text-slate-300 border-b border-slate-200/70 dark:border-slate-700 pb-2">
                          <span>歷史訂單清單 (共 {totalOrders} 筆 • ${totalSales} 元 • {paidCount} 筆已付)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                          {orders.map((sub) => (
                            <div
                              key={sub.id}
                              className="bg-white dark:bg-[#0E1726] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                <div>
                                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                                    {sub.user_nickname}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                                    #{sub.order_number}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    sub.is_paid
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                  }`}
                                >
                                  {sub.is_paid ? '已付款' : '未付款'}
                                </span>
                              </div>
                              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                                {(sub.order_items || []).map((item) => (
                                  <div key={item.id} className="flex justify-between">
                                    <span>• {item.item_name} x {item.quantity}</span>
                                    <span className="font-mono font-bold">${item.unit_price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-black">
                                <span className="text-slate-400 text-[10px]">{formatDateTime(sub.created_at)}</span>
                                <span className="text-sky-600 dark:text-sky-400 font-mono">${sub.final_amount} 元</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
