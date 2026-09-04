-- ==============================================================================
-- 🗑️ 咩nu 平台：Supabase 會員帳號「徹底自資料庫刪除」專用 SQL 權限函式
-- ==============================================================================
-- 【使用指引】：
-- 1. 登入 Supabase 專案後台 (https://supabase.com/dashboard)
-- 2. 進入左側選單「SQL Editor」->「New query」
-- 3. 貼上並執行 (Run) 以下 SQL 腳本
-- 4. 執行完成後，前台會員點擊「註銷帳號」時即可直接由資料庫底層徹底清除自身帳號（即使未配置 Service Role Key 亦可安全運作）
-- ==============================================================================

-- 1. 建立 delete_user_account 安全刪除函式 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- 取得目前發送 JWT 請求之認證使用者 UID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION '未經授權的操作：無法取得當前使用者身分 (auth.uid() is null)';
  END IF;

  -- 1. 清理 public 綱要中任何潛在的使用者關聯表 (若存在)
  BEGIN
    DELETE FROM public.profiles WHERE id = current_user_id;
  EXCEPTION WHEN undefined_table THEN
    -- 表不存在則自動略過
    NULL;
  END;

  BEGIN
    DELETE FROM public.user_profiles WHERE user_id = current_user_id;
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;

  -- 2. 徹底刪除 auth.users 核心使用者表記錄
  -- （PostgreSQL 外鍵級聯會自動同步刪除 auth.identities, auth.sessions, auth.mfa_factors, WebAuthn passkeys）
  DELETE FROM auth.users WHERE id = current_user_id;

END;
$$;

-- 2. 安全權限配置：撤銷匿名存取，僅授權已登入的使用者 (authenticated) 執行自身刪除
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- ==============================================================================
-- 💡 替代方案 (亦可在 Vercel / .env.local 配置 SUPABASE_SERVICE_ROLE_KEY)：
-- 至 Supabase Dashboard > Project Settings > API > 複製 "service_role (secret)"
-- 並在 Vercel 專案環境變數與 .env.local 新增：
-- SUPABASE_SERVICE_ROLE_KEY=您的_service_role_secret_key
-- ==============================================================================
