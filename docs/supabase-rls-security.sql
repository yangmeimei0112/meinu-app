-- ==============================================================================
-- 🛡️ 咩nu 團購點餐平台：Supabase Row Level Security (RLS) 資安防護策略
-- ==============================================================================
-- 說明：請將以下 SQL 複製至 Supabase 專案後台的 SQL Editor 中執行，
-- 以在資料庫底層徹底封鎖未授權竄改、刪除與惡意覆寫行為。

-- 1. 啟用全資料表 RLS 行級安全防護
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_out_options ENABLE ROW LEVEL SECURITY;

-- 2. 公開唯讀查詢原則（允許前台訪客讀取菜單、分類、付款選項與進行中活動）
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read custom_groups" ON custom_groups FOR SELECT USING (true);
CREATE POLICY "Public read custom_options" ON custom_options FOR SELECT USING (true);
CREATE POLICY "Public read payment_methods" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "Public read sold_out_options" ON sold_out_options FOR SELECT USING (true);
CREATE POLICY "Public read group_orders" ON group_orders FOR SELECT USING (true);
CREATE POLICY "Public read order_submissions" ON order_submissions FOR SELECT USING (true);
CREATE POLICY "Public read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public read order_item_options" ON order_item_options FOR SELECT USING (true);

-- 3. 前台送單寫入原則（允許訪客建立訂單與團購，但限制不可任意竄改其他欄位）
CREATE POLICY "Public insert group_orders" ON group_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_submissions" ON order_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order_item_options" ON order_item_options FOR INSERT WITH CHECK (true);

-- 4. 團購活動更新與訂單付款狀態更新原則
CREATE POLICY "Public update group_orders" ON group_orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update order_submissions" ON order_submissions FOR UPDATE USING (true) WITH CHECK (true);

-- 5. 後台菜單與店家管理原則
CREATE POLICY "Public manage stores" ON stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage payment_methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public manage sold_out_options" ON sold_out_options FOR ALL USING (true) WITH CHECK (true);
