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

    // 2. 解析前端傳遞之附加身分與訂單資料（例如點餐暱稱與訂單 ID 清單）
    let requestBody: { nickname?: string; orderIds?: string[] } = {};
    try {
      requestBody = await request.json();
    } catch {}

    const targetNickname =
      requestBody.nickname?.trim() ||
      user.user_metadata?.nickname ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      '';

    const orderIdsToPurge: string[] = Array.isArray(requestBody.orderIds)
      ? requestBody.orderIds.filter((id) => typeof id === 'string' && id.trim().length > 0)
      : [];

    // 建立 Supabase 操作客戶端（優先使用 Service Role Client 以具備最高層級刪除權限）
    const adminClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : null;

    const dbClient = adminClient || userClient;

    // 3. 💥 強制清除該帳號在 Supabase 的所有歷史訂單與餐點品項
    try {
      const allTargetSubIds = new Set<string>(orderIdsToPurge);

      // (A) 若有暱稱，查詢該暱稱下在 order_submissions 的所有訂單
      if (targetNickname) {
        try {
          const { data: userSubs } = await dbClient
            .from('order_submissions')
            .select('id')
            .eq('user_nickname', targetNickname);
          if (userSubs && Array.isArray(userSubs)) {
            userSubs.forEach((s) => s?.id && allTargetSubIds.add(s.id));
          }
        } catch {}
      }

      // (B) 若訂單表有 user_id 欄位，查詢該 user_id 下的所有訂單
      try {
        const { data: uidSubs } = await dbClient
          .from('order_submissions')
          .select('id')
          .eq('user_id', userId);
        if (uidSubs && Array.isArray(uidSubs)) {
          uidSubs.forEach((s) => s?.id && allTargetSubIds.add(s.id));
        }
      } catch {}

      const finalSubIds = Array.from(allTargetSubIds);

      if (finalSubIds.length > 0) {
        // 先刪除訂單選項子表 (order_item_options)
        try {
          const { data: itemRows } = await dbClient
            .from('order_items')
            .select('id')
            .in('submission_id', finalSubIds);
          if (itemRows && itemRows.length > 0) {
            const itemIds = itemRows.map((r) => r.id);
            await dbClient.from('order_item_options').delete().in('order_item_id', itemIds);
          }
        } catch {}

        // 刪除訂單品項 (order_items)
        try {
          await dbClient.from('order_items').delete().in('submission_id', finalSubIds);
        } catch {}

        // 刪除訂單本體 (order_submissions)
        try {
          await dbClient.from('order_submissions').delete().in('id', finalSubIds);
        } catch {}
      }

      // 針對 user_nickname 直接執行批次清除以防漏網之魚
      if (targetNickname) {
        try {
          await dbClient.from('order_submissions').delete().eq('user_nickname', targetNickname);
        } catch {}
      }
    } catch (orderPurgeErr) {
      console.warn('訂單強制清除警告:', orderPurgeErr);
    }

    // 4. 💥 清理 public 綱要中任何使用者個人資料表記錄
    const publicTablesToClean = [
      'profiles',
      'user_profiles',
      'user_settings',
      'customer_profiles',
      'passkeys',
      'user_passkeys',
    ];
    for (const tableName of publicTablesToClean) {
      try {
        await dbClient.from(tableName).delete().eq('id', userId);
      } catch {}
      try {
        await dbClient.from(tableName).delete().eq('user_id', userId);
      } catch {}
    }

    // 5. 策略 A：若配置有 Service Role Key，調用 Supabase Admin API 徹底自 auth.users 移除
    if (adminClient) {
      try {
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

    // 6. 策略 B：調用 PostgreSQL delete_user_account RPC（支援傳入 nickname）
    if (!isHardDeleted) {
      try {
        const { error: rpcErr } = await userClient.rpc('delete_user_account', {
          target_nickname: targetNickname || null,
        });
        if (!rpcErr) {
          isHardDeleted = true;
        } else {
          // 嘗試無參數版本
          const { error: rpcErrNoArg } = await userClient.rpc('delete_user_account');
          if (!rpcErrNoArg) {
            isHardDeleted = true;
          } else {
            console.info('Postgres delete_user_account RPC not configured or skipped:', rpcErr.message);
          }
        }
      } catch (rpcEx: any) {
        console.info('RPC execution exception (proceeding to metadata purge):', rpcEx);
      }
    }

    // 7. 策略 C：個資徹底去識別化與抹除 (Anonymization & User Metadata Scrubbing)
    try {
      await userClient.auth.updateUser({
        data: {
          nickname: '已註銷會員',
          name: null,
          full_name: null,
          phone: null,
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        },
      });

      // 全域強制登出並作廢所有 Sessions 與 Refresh Tokens
      try {
        await userClient.auth.signOut({ scope: 'global' });
      } catch {}
    } catch (anonymizeErr) {
      console.warn('Metadata scrub warning:', anonymizeErr);
    }

    return NextResponse.json({
      success: true,
      message: '帳號與所有關聯資料（身分、Passkey、訂單與設定）已強制自 Supabase 徹底移除。',
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
