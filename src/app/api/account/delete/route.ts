import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: '未提供授權憑證，請先登入後再試' },
        { status: 401 }
      );
    }

    // 1. 驗證使用者的 JWT 憑證並取得 UID
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '使用者身分驗證失敗，憑證可能已過期，請重新登入' },
        { status: 401 }
      );
    }

    const userId = user.id;
    let isHardDeleted = false;
    let deletionErrorDetail = '';

    // 2. 策略 A：若伺服端配置有 Service Role Key，調用 Supabase Admin API 徹底自 auth.users 移除
    if (supabaseServiceKey) {
      try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        // (1) 清理 public 綱要中任何潛在的使用者關聯表記錄
        const publicTablesToClean = ['profiles', 'user_profiles', 'user_settings', 'customer_profiles'];
        for (const tableName of publicTablesToClean) {
          try {
            await adminClient.from(tableName).delete().eq('id', userId);
          } catch {}
          try {
            await adminClient.from(tableName).delete().eq('user_id', userId);
          } catch {}
        }

        // (2) 徹底刪除 Supabase auth.users 記錄（連帶級聯刪除 identities, passkeys, sessions, mfa）
        const { error: adminDeleteErr } = await adminClient.auth.admin.deleteUser(userId);
        if (!adminDeleteErr) {
          isHardDeleted = true;
        } else {
          console.error('Supabase admin deleteUser failed:', adminDeleteErr);
          deletionErrorDetail = adminDeleteErr.message;
        }
      } catch (err: any) {
        console.error('Admin deleteUser exception:', err);
        deletionErrorDetail = err?.message || 'Admin API 連線異常';
      }
    }

    // 3. 策略 B：若未配置 Service Role Key 或 Admin 呼叫失敗，嘗試調用 PostgreSQL delete_user_account RPC
    if (!isHardDeleted) {
      try {
        const { error: rpcErr } = await userClient.rpc('delete_user_account');
        if (!rpcErr) {
          isHardDeleted = true;
        } else {
          console.warn('Postgres delete_user_account RPC failed/not found:', rpcErr);
          if (!deletionErrorDetail) {
            deletionErrorDetail = rpcErr.message;
          }
        }
      } catch (rpcEx: any) {
        console.warn('RPC execution exception:', rpcEx);
      }
    }

    // 4. 嚴格檢驗：若未達成真正自資料庫刪除，拒絕偽成功回傳，明確告知原因
    if (!isHardDeleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            '資料庫帳號徹底刪除失敗：請確認已於環境變數配置 SUPABASE_SERVICE_ROLE_KEY，或於 Supabase SQL Editor 執行 docs/supabase-account-deletion.sql 建立刪除權限函式。',
          details: deletionErrorDetail,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '帳號已成功自資料庫永久註銷，所有個人身分資料、登入憑證與金鑰已全數刪除。',
    });
  } catch (error: any) {
    console.error('Account delete endpoint exception:', error);
    return NextResponse.json(
      { success: false, message: error?.message || '伺服端處理異常' },
      { status: 500 }
    );
  }
}
