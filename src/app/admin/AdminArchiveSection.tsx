'use client';

import { GroupOrderAdmin, AdminViewMode } from './admin-types';

interface AdminArchiveSectionProps {
  viewMode?: AdminViewMode;
  archivedGroups: GroupOrderAdmin[];
  selectedArchivedGroupId: string | null;
  setSelectedArchivedGroupId: (value: string | null) => void;
  handleReopenGroup: (group: GroupOrderAdmin) => void;
}

export function AdminArchiveSection({
  viewMode = 'desktop',
  archivedGroups,
  selectedArchivedGroupId,
  setSelectedArchivedGroupId,
  handleReopenGroup,
}: AdminArchiveSectionProps) {
  const isDesktop = viewMode === 'desktop';

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span>🗂️ 歷史團購活動歸檔</span>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              共 {archivedGroups.length} 個歷史紀錄
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            過去發起並已結案的團購活動，可隨時「一鍵開新團」複製相同設定重新發起
          </p>
        </div>
      </div>

      {archivedGroups.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-xs text-slate-400 space-y-2">
          <div className="text-3xl">🗂️</div>
          <p className="font-bold text-slate-600">目前尚無已結案的封存團購活動</p>
          <p>當進行中的團購活動結案歸檔後，將會在此處保存備查。</p>
        </div>
      ) : (
        <div className={isDesktop ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {archivedGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-3xl border p-5 transition flex flex-col justify-between space-y-3.5 hover:shadow-md ${
                selectedArchivedGroupId === group.id
                  ? 'border-sky-300 bg-sky-50/60 ring-2 ring-sky-200'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedArchivedGroupId(group.id)}
                    className="text-left font-black text-slate-800 text-sm hover:text-sky-700 transition"
                  >
                    {group.title}
                  </button>
                  <span className="bg-slate-200 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full shrink-0">
                    已結案
                  </span>
                </div>

                {group.announcement && (
                  <p className="text-[11px] text-slate-500 bg-white/70 p-2 rounded-xl border border-slate-200/50">
                    📢 {group.announcement}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">外送費</span>
                  <span className="font-extrabold text-slate-700">${group.delivery_fee}</span>
                </div>
                <div className="border-x border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">折扣</span>
                  <span className="font-extrabold text-slate-700">${group.discount_amount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">取整</span>
                  <span className="font-extrabold text-slate-700">
                    {group.rounding_rule === 'ceil'
                      ? '進位'
                      : group.rounding_rule === 'round'
                      ? '四捨五入'
                      : '捨去'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleReopenGroup(group)}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-105 text-white text-xs font-bold py-2.5 rounded-2xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>🔄 一鍵以此設定開新團</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
