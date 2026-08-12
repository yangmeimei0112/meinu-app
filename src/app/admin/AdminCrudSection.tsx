import { Category, MenuItem, Store } from '@/types/database';

interface AdminCrudSectionProps {
  stores: Store[];
  categories: Category[];
  menuItems: MenuItem[];
  selectedStoreId: string | null;
  setSelectedStoreId: (value: string | null) => void;
  onCreateStore: () => void;
  onDeleteStore: (id: string) => void;
  onMoveCategory: (id: string, direction: 'up' | 'down') => void;
  onDeleteCategory: (id: string) => void;
  onCreateMenuItem: () => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleMenuItemActive: (id: string) => void;
  onUpdateStore: (id: string, field: 'name' | 'category_id' | 'image_url' | 'is_active', value: string | boolean | null) => void;
  onUpdateCategory: (id: string, field: 'name', value: string) => void;
  onUpdateMenuItem: (id: string, field: keyof MenuItem, value: string | number | boolean | null) => void;
}

export function AdminCrudSection({
  stores,
  categories,
  menuItems,
  selectedStoreId,
  setSelectedStoreId,
  onCreateStore,
  onDeleteStore,
  onMoveCategory,
  onDeleteCategory,
  onCreateMenuItem,
  onDeleteMenuItem,
  onToggleMenuItemActive,
  onUpdateStore,
  onUpdateCategory,
  onUpdateMenuItem,
}: AdminCrudSectionProps) {
  const visibleMenuItems = menuItems.filter((item) => item.store_id === selectedStoreId);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-[0.12em]">門市資訊</h3>
          <button
            type="button"
            onClick={onCreateStore}
            className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg"
          >
            ＋ 新增門市
          </button>
        </div>

        <div className="space-y-2">
          {stores.map((store) => (
            <div key={store.id} className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStoreId(store.id)}
                  className={`text-left flex-1 ${selectedStoreId === store.id ? 'font-extrabold text-sky-700' : 'font-bold text-slate-700'}`}
                >
                  {store.name || '未命名門市'}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteStore(store.id)}
                  className="text-[10px] text-rose-600 font-bold hover:text-rose-700"
                >
                  刪除
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <input
                  value={store.name}
                  onChange={(e) => onUpdateStore(store.id, 'name', e.target.value)}
                  placeholder="門市名稱"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                />
                <input
                  value={store.category_id ?? ''}
                  onChange={(e) => onUpdateStore(store.id, 'category_id', e.target.value || null)}
                  placeholder="類別 ID"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                />
                <input
                  value={store.image_url ?? ''}
                  onChange={(e) => onUpdateStore(store.id, 'image_url', e.target.value || null)}
                  placeholder="圖片 URL"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 col-span-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-[0.12em]">商品分類</h3>
          <button
            type="button"
            onClick={onCreateStore}
            className="bg-sky-100 hover:bg-sky-200 text-sky-700 text-[10px] font-bold px-2 py-1.5 rounded-lg"
          >
            ＋ 新增分類
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="border border-slate-200 rounded-2xl p-2.5 bg-slate-50">
              <div className="flex items-center gap-2">
                <input
                  value={category.name}
                  onChange={(e) => onUpdateCategory(category.id, 'name', e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                />
                <button type="button" onClick={() => onMoveCategory(category.id, 'up')} className="text-[10px] text-slate-500">↑</button>
                <button type="button" onClick={() => onMoveCategory(category.id, 'down')} className="text-[10px] text-slate-500">↓</button>
                <button type="button" onClick={() => onDeleteCategory(category.id)} className="text-[10px] text-rose-600 font-bold">刪除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-[0.12em]">菜單商品</h3>
          <button
            type="button"
            onClick={onCreateMenuItem}
            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-1.5 rounded-lg"
          >
            ＋ 新增商品
          </button>
        </div>

        <div className="space-y-2">
          {visibleMenuItems.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleMenuItemActive(item.id)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      !item.is_sold_out ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {!item.is_sold_out ? '上架中' : '已下架'}
                  </button>
                </div>
                <button type="button" onClick={() => onDeleteMenuItem(item.id)} className="text-[10px] text-rose-600 font-bold">刪除</button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <input
                  value={item.name}
                  onChange={(e) => onUpdateMenuItem(item.id, 'name', e.target.value)}
                  placeholder="商品名稱"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => onUpdateMenuItem(item.id, 'price', Number(e.target.value))}
                  placeholder="價格"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                />
                <input
                  value={item.description ?? ''}
                  onChange={(e) => onUpdateMenuItem(item.id, 'description', e.target.value || null)}
                  placeholder="描述"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 col-span-2"
                />
                <input
                  type="number"
                  value={item.stock_quantity ?? ''}
                  onChange={(e) => onUpdateMenuItem(item.id, 'stock_quantity', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="庫存"
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
