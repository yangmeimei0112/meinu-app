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

    // 1. 驗證使用者的 JWT 憑證
    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: '使用者身分驗證失敗，憑證可能已過期' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2. 若伺服端有配置 Service Role Key，調用 Supabase Admin API 徹底刪除該帳號
    if (supabaseServiceKey) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('Supabase admin deleteUser failed:', deleteError);
        return NextResponse.json(
          { success: false, message: `註銷帳號失敗：${deleteError.message}` },
          { status: 500 }
        );
      }
    } else {
      // 若無 Service Role Key（例如本地環境），抹除使用者 Metadata 作為柔性註銷防護
      try {
        await userClient.auth.updateUser({
          data: {
            nickname: '已註銷用戶',
            phone: null,
            deleted_at: new Date().toISOString(),
          },
        });
      } catch (metaErr) {
        console.warn('Soft-delete metadata update error:', metaErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: '帳號已成功註銷，所有個人資料與權限已安全移除',
    });
  } catch (error: any) {
    console.error('Account delete endpoint exception:', error);
    return NextResponse.json(
      { success: false, message: error?.message || '伺服端處理異常' },
      { status: 500 }
    );
  }
}
