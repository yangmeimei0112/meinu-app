'use client';

import { useState } from 'react';
import { GroupOrderAdmin, AdminViewMode } from './admin-types';

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
  const isDesktop = viewMode === 'desktop';

  const isAllSelected = archivedGroups.length > 0 && selectedGroupIds.length === archivedGroups.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(archivedGroups.map((g) => g.id));
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

  return (
    <div className="bg-white dark:bg-[#131B2B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs space-y-4">
      {/* 頂部標題列與操作列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>🗂️ 歷史團購活動歸檔</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-transparent dark:border-slate-700">
              共 {archivedGroups.length} 個歷史紀錄
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
            過去發起並已結案的團購活動，可隨時「一鍵開新團」複製設定，亦可清理刪除舊紀錄
          </p>
        </div>

        {/* 全選與批次刪除按鈕群 */}
        {archivedGroups.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
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
              <span>{isAllSelected ? '取消全選' : '全選所有歸檔'}</span>
            </button>

            {selectedGroupIds.length > 0 && (
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer animate-in fade-in duration-150"
              >
                <span>🗑️</span>
                <span>批次刪除選取 ({selectedGroupIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {archivedGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182234] p-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <div className="text-3xl">🗂️</div>
          <p className="font-bold text-slate-600 dark:text-slate-300">目前尚無已結案的封存團購活動</p>
          <p>當進行中的團購活動結案歸檔後，將會在此處保存備查。</p>
        </div>
      ) : (
        <div className={isDesktop ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {archivedGroups.map((group) => {
            const isChecked = selectedGroupIds.includes(group.id);

            return (
              <div
                key={group.id}
                onClick={() => setSelectedArchivedGroupId(group.id)}
                className={`rounded-3xl border p-5 transition flex flex-col justify-between space-y-3.5 hover:shadow-md cursor-pointer ${
                  isChecked
                    ? 'border-sky-400 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-300 dark:ring-sky-700/60'
                    : selectedArchivedGroupId === group.id
                    ? 'border-sky-300 dark:border-sky-500 bg-sky-50/30 dark:bg-sky-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182234]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    {/* 選取核取方塊與標題 */}
                    <div className="flex items-start gap-2 min-w-0">
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
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">
                        {group.title}
                      </h4>
                    </div>

                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                      已結案
                    </span>
                  </div>

                  {group.announcement && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-300 bg-white/70 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700">
                      📢 {group.announcement}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-white dark:bg-[#131B2B] p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold">外送費</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">${group.delivery_fee}</span>
                  </div>
                  <div className="border-x border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold">折扣</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">${group.discount_amount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold">取整</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">
                      {group.rounding_rule === 'ceil'
                        ? '進位'
                        : group.rounding_rule === 'round'
                        ? '四捨五入'
                        : '捨去'}
                    </span>
                  </div>
                </div>

                {/* 底部操作按鈕群 */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReopenGroup(group);
                    }}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>🔄 開新團</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteArchivedGroup(group.id, group.title);
                    }}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold px-3 py-2 rounded-xl border border-transparent dark:border-slate-700 transition active:scale-95 cursor-pointer flex items-center gap-1"
                    title="刪除此歸檔紀錄"
                  >
                    <span>🗑️</span>
                    <span className="hidden sm:inline">刪除</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
