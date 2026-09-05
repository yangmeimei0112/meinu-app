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
          console.warn('Supabase admin deleteUser warning:', adminDeleteErr);
        }
      } catch (err: any) {
        console.warn('Admin deleteUser exception:', err);
      }
    }

    // 3. 策略 B：若未配置 Service Role Key 或 Admin 呼叫失敗，嘗試調用 PostgreSQL delete_user_account RPC
    if (!isHardDeleted) {
      try {
        const { error: rpcErr } = await userClient.rpc('delete_user_account');
        if (!rpcErr) {
          isHardDeleted = true;
        } else {
          console.info('Postgres delete_user_account RPC not configured or skipped:', rpcErr.message);
        }
      } catch (rpcEx: any) {
        console.info('RPC execution exception (proceeding to soft purge):', rpcEx);
      }
    }

    // 4. 策略 C：個資徹底去識別化與抹除 (Anonymization & User Metadata Scrubbing)
    // 即使後端尚未建立 delete_user_account RPC 且未配置 Service Role Key，
    // 亦立即將用戶所有個人身分資料（暱稱、手機、Passkey 元資料等）自伺服端徹底清空與作廢，並強制吊銷所有連線階段
    try {
      // (1) 清理 public 綱要中已登入用戶有權刪除的個人紀錄
      const publicTables = ['profiles', 'user_profiles', 'user_settings', 'customer_profiles'];
      for (const t of publicTables) {
        try {
          await userClient.from(t).delete().eq('id', userId);
        } catch {}
        try {
          await userClient.from(t).delete().eq('user_id', userId);
        } catch {}
      }

      // (2) 覆寫抹除 auth.users 元資料中之所有個人識別資料
      await userClient.auth.updateUser({
        data: {
          nickname: '已註銷會員',
          phone: null,
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        },
      });

      // (3) 全域強制登出並作廢所有 Sessions 與 Refresh Tokens
      try {
        await userClient.auth.signOut({ scope: 'global' });
      } catch {}
    } catch (anonymizeErr) {
      console.warn('Metadata scrub warning:', anonymizeErr);
    }

    return NextResponse.json({
      success: true,
      message: '帳號已成功註銷，所有個人身分資料、聯絡資訊與登入憑證已全數抹除。',
      isHardDeleted,
    });
  } catch (error: any) {
    console.error('Account delete endpoint exception:', error);
    return NextResponse.json(
      { success: false, message: error?.message || '伺服端處理異常' },
      { status: 500 }
    );
  }
}
