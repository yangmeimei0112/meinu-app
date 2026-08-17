'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { GroupOrderAdmin, AdminViewMode, OrderSubmissionAdmin } from './admin-types';

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
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      {/* 頂部標題列與操作列 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>🗂️ 歷史團購活動歸檔</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-transparent dark:border-slate-700">
              共 {archivedGroups.length} 個歷史活動
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
            過去發起並已結案的團購活動，點擊可展開查看歷史訂單名單，亦可一鍵複製開新團或清理舊紀錄
          </p>
        </div>

        {/* 搜尋與全選/批次刪除工具列 */}
        <div className="flex items-center gap-2 flex-wrap">
          {archivedGroups.length > 0 && (
            <>
              {/* 搜尋輸入框 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜尋歷史活動或店家..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-[#182234] border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 pl-7 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  🔍
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border active:scale-95 cursor-pointer ${
                  isAllSelected
                    ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{isAllSelected ? '☑️' : '⬜'}</span>
                <span>{isAllSelected ? '取消全選' : '全選'}</span>
              </button>

              {selectedGroupIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteBatchDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer animate-in fade-in duration-150"
                >
                  <span>🗑️ 批次刪除 ({selectedGroupIds.length})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {archivedGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182234] p-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <div className="text-3xl">🗂️</div>
          <p className="font-bold text-slate-600 dark:text-slate-300">目前尚無已結案的封存團購活動</p>
          <p>當進行中的團購活動結案歸檔後，將會在此處保存備查。</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182234] p-8 text-center text-xs text-slate-400">
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
                className={`rounded-3xl border transition overflow-hidden shadow-xs ${
                  isChecked
                    ? 'border-sky-400 dark:border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 ring-2 ring-sky-300 dark:ring-sky-700/60'
                    : selectedArchivedGroupId === group.id
                    ? 'border-sky-300 dark:border-sky-500 bg-white dark:bg-[#141E30]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2B]'
                }`}
              >
                {/* 歷史團購活動卡片頭部資訊 (清晰辨識) */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* 核取方塊 */}
                      <button
                        type="button"
                        aria-label={`選取歷史活動 ${group.title}`}
                        onClick={(e) => handleToggleSelectItem(group.id, e)}
                        className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center text-[10px] font-bold transition shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-sky-500 text-white border-sky-500'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-sky-400'
                        }`}
                      >
                        {isChecked && '✓'}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 店家標籤 */}
                          <span className="text-[11px] font-extrabold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-800/60">
                            🏪 {group.stores?.name || '合作門市'}
                          </span>

                          {/* 狀態標籤 */}
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                            📦 已結案歸檔
                          </span>

                          {/* 建立日期時間 */}
                          {(group as any).created_at && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
                              🕒 {formatDateTime((group as any).created_at)}
                            </span>
                          )}
                        </div>

                        {/* 團購活動主標題 */}
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-base leading-tight">
                          {group.title}
                        </h4>
                      </div>
                    </div>

                    {/* 右側操作按鈕群 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReopenGroup(group)}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="一鍵以此設定複製開新團"
                      >
                        <span>🔄</span>
                        <span className="hidden sm:inline">開新團</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArchivedGroup(group.id, group.title)}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
                        title="刪除此歸檔活動紀錄"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 公告文字 (若有) */}
                  {group.announcement && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#182234] p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 leading-relaxed">
                      📢 <span className="font-medium">{group.announcement}</span>
                    </p>
                  )}

                  {/* 參數設定摘要欄 */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 dark:bg-[#182234] p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">外送費</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">
                        ${group.delivery_fee}
                      </span>
                    </div>
                    <div className="border-x border-slate-200/60 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-bold block">折扣金額</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">
                        ${group.discount_amount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">取整分攤</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">
                        {group.rounding_rule === 'ceil'
                          ? '進位'
                          : group.rounding_rule === 'round'
                          ? '四捨五入'
                          : '捨去'}
                      </span>
                    </div>
                    <div className="hidden sm:block border-l border-slate-200/60 dark:border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-bold block">門檻限制</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">
                        {group.enable_min_threshold ? `$${group.min_threshold_amount} 起送` : '無門檻'}
                      </span>
                    </div>
                  </div>

                  {/* 展開/收合訂單明細按鈕 */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => handleToggleExpandOrders(group.id, e)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <span>{isExpanded ? '▲ 收合訂單明細' : '▼ 查看歷史訂單名單與餐點明細'}</span>
                      {orders.length > 0 && (
                        <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] px-2 py-0.2 rounded-full font-extrabold">
                          共 {orders.length} 筆
                        </span>
                      )}
                    </button>

                    {isExpanded && orders.length > 0 && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        總額 <span className="text-sky-600 dark:text-sky-400 font-extrabold">${totalSales}</span> 元 (
                        {paidCount}/{totalOrders} 已付)
                      </span>
                    )}
                  </div>
                </div>

                {/* 展開後的各筆訂單清單 (清晰呈現個別團員、品項、客製備註、金額與付款方式) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0E1522] p-4 sm:p-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
                    <h5 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span>📋 歷史訂單詳細清單</span>
                      {isLoadingOrders && (
                        <span className="text-slate-400 font-normal animate-pulse">正在載入訂單中...</span>
                      )}
                    </h5>

                    {isLoadingOrders ? (
                      <div className="text-center py-6 text-xs text-slate-400 animate-pulse">
                        正在同步此團購歷史訂單...
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        此活動結案時無任何下單紀錄。
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {orders.map((order, idx) => (
                          <div
                            key={order.id}
                            className="bg-white dark:bg-[#131B2B] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5"
                          >
                            {/* 訂單頂部：序號、團員暱稱、付款狀態 */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-black">
                                  #{idx + 1}
                                </span>
                                <span className="font-black text-slate-800 dark:text-slate-100 text-xs">
                                  👤 {order.user_nickname}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    order.is_paid
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                                  }`}
                                >
                                  {order.is_paid ? '✅ 已付款' : '⏳ 待付款'}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                                  {order.payment_method_name}
                                </span>
                              </div>
                            </div>

                            {/* 訂單餐點品項清單 */}
                            <div className="space-y-1 text-xs">
                              {order.order_items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between gap-2 text-slate-700 dark:text-slate-200"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold">{item.item_name}</span>
                                    <span className="text-slate-400 font-bold ml-1.5">x{item.quantity}</span>
                                    {item.custom_notes && (
                                      <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium pl-2">
                                        ↳ {item.custom_notes}
                                      </p>
                                    )}
                                  </div>
                                  <span className="font-extrabold shrink-0 text-slate-800 dark:text-slate-100">
                                    ${item.unit_price * item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* 訂單底部：缺貨備案、下單時間與實付總額 */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                              <div className="text-slate-400 text-[10px] space-y-0.5">
                                {order.sold_out_option && (
                                  <div>📞 缺貨：{order.sold_out_option}</div>
                                )}
                                <div>🕒 {formatDateTime(order.created_at)}</div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 font-bold block">實付金額</span>
                                <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                                  ${order.final_amount} 元
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
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
