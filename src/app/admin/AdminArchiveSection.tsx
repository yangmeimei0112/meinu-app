import { GroupOrderAdmin } from './admin-types';

interface AdminArchiveSectionProps {
  archivedGroups: GroupOrderAdmin[];
  selectedArchivedGroupId: string | null;
  setSelectedArchivedGroupId: (value: string | null) => void;
  handleReopenGroup: (storeId?: string) => void;
}

export function AdminArchiveSection({
  archivedGroups,
  selectedArchivedGroupId,
  setSelectedArchivedGroupId,
  handleReopenGroup,
}: AdminArchiveSectionProps) {
  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
      <h3 className="text-xs font-bold text-slate-700">🗂️ 歷史訂單封存列表</h3>

      {archivedGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-400">
          目前沒有封存資料。
        </div>
      ) : (
        <div className="space-y-2">
          {archivedGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-2xl border p-3 ${selectedArchivedGroupId === group.id ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedArchivedGroupId(group.id)}
                  className="text-left flex-1 text-sm font-extrabold text-slate-800"
                >
                  {group.title}
                </button>
                <button
                  type="button"
                  onClick={() => handleReopenGroup(group.store_id)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg"
                >
                  重新開啟
                </button>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 space-y-1">
                <p>狀態：{group.status === 'completed' ? '已完成' : group.status}</p>
                <p>運費：${group.delivery_fee}</p>
                <p>折扣：${group.discount_amount}</p>
                <p>取整：{group.rounding_rule}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
