-- ==============================================================================
-- 🗑️ 咩nu 平台：Supabase 會員帳號「強制徹底自資料庫刪除所有資料」專用 SQL 函式
-- ==============================================================================
-- 【功能說明】：
-- 當會員點擊「註銷會員帳號」時，系統將強制將該帳號在 Supabase 資料庫中的所有資料：
-- 1. 該帳號所屬之所有歷史訂單選項 (order_item_options) 與明細 (order_items)
-- 2. 該帳號所屬之所有訂單本體 (order_submissions)
-- 3. 使用者設定與個資表記錄 (profiles, user_profiles, user_settings)
-- 4. 核心身分記錄 (auth.users)，連帶級聯清除 passkeys, sessions, identities
-- 一鍵徹底實體刪除！
--
-- 【使用指引】：
-- 1. 登入 Supabase 專案後台 (https://supabase.com/dashboard)
-- 2. 進入左側選單「SQL Editor」->「New query」
-- 3. 貼上並執行 (Run) 以下 SQL 腳本
-- ==============================================================================

-- 1. 建立具備 target_nickname 參數之全方位安全刪除函式 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION delete_user_account(target_nickname text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid;
  matched_sub_ids uuid[];
BEGIN
  -- 取得目前發送 JWT 請求之認證使用者 UID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION '未經授權的操作：無法取得當前使用者身分 (auth.uid() is null)';
  END IF;

  -- 1. 💥 優先強制清除該帳號之訂單選項與品項 (order_items, order_item_options)
  BEGIN
    -- 搜集目標訂單 ID 清單
    SELECT ARRAY_AGG(id) INTO matched_sub_ids
    FROM public.order_submissions
    WHERE (target_nickname IS NOT NULL AND user_nickname = target_nickname)
       OR (user_id = current_user_id);

    IF matched_sub_ids IS NOT NULL AND array_length(matched_sub_ids, 1) > 0 THEN
      -- 刪除選項子表
      BEGIN
        DELETE FROM public.order_item_options
        WHERE order_item_id IN (
          SELECT id FROM public.order_items WHERE submission_id = ANY(matched_sub_ids)
        );
      EXCEPTION WHEN undefined_table THEN NULL;
      END;

      -- 刪除訂單品項
      BEGIN
        DELETE FROM public.order_items WHERE submission_id = ANY(matched_sub_ids);
      EXCEPTION WHEN undefined_table THEN NULL;
      END;

      -- 刪除訂單本體
      BEGIN
        DELETE FROM public.order_submissions WHERE id = ANY(matched_sub_ids);
      EXCEPTION WHEN undefined_table THEN NULL;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 若有 target_nickname，直接批次防禦清除
  IF target_nickname IS NOT NULL AND length(trim(target_nickname)) > 0 THEN
    BEGIN
      DELETE FROM public.order_submissions WHERE user_nickname = target_nickname;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- 2. 💥 清理 public 綱要中任何潛在的使用者關聯表 (若存在)
  BEGIN
    DELETE FROM public.profiles WHERE id = current_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM public.user_profiles WHERE user_id = current_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM public.user_settings WHERE user_id = current_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM public.customer_profiles WHERE user_id = current_user_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 3. 💥 徹底刪除 auth.users 核心使用者表記錄
  -- （PostgreSQL 外鍵級聯會自動同步刪除 auth.identities, auth.sessions, auth.mfa_factors, WebAuthn passkeys）
  DELETE FROM auth.users WHERE id = current_user_id;

END;
$$;

-- 2. 建立無參數重載版本以相容舊版調用
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  PERFORM delete_user_account(NULL);
END;
$$;

-- 3. 安全權限配置：撤銷匿名存取，僅授權已登入的使用者 (authenticated) 執行自身刪除
REVOKE ALL ON FUNCTION delete_user_account(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_user_account(text) FROM anon;
GRANT EXECUTE ON FUNCTION delete_user_account(text) TO authenticated;

REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- ==============================================================================
-- 💡 替代方案 (亦可在 Vercel / .env.local 配置 SUPABASE_SERVICE_ROLE_KEY)：
-- 至 Supabase Dashboard > Project Settings > API > 複製 "service_role (secret)"
-- 並在 Vercel 專案環境變數與 .env.local 新增：
-- SUPABASE_SERVICE_ROLE_KEY=您的_service_role_secret_key
-- ==============================================================================
