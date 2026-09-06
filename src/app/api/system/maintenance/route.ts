import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-util';
import { MaintenanceScope, VALID_SCOPES, MaintenanceConfig } from '@/lib/maintenanceConfig';
import { readMaintenanceConfig, writeMaintenanceConfig } from '@/lib/maintenanceServer';

// 供前台訪客快速查詢維護狀態與生效範圍
export async function GET() {
  const config = readMaintenanceConfig();
  const activeScopes = config.scopes && config.scopes.length > 0 ? config.scopes : [config.scope || 'all'];

  return NextResponse.json(
    {
      is_maintenance: config.is_maintenance,
      scope: config.is_maintenance ? (config.scope || 'all') : 'all',
      scopes: config.is_maintenance ? activeScopes : ['all'],
      title: config.is_maintenance ? config.title : '',
      message: config.is_maintenance ? config.message : '',
      estimated_end_time: config.is_maintenance ? (config.estimated_end_time || '') : '',
      reason: config.is_maintenance ? (config.reason || '') : '',
      custom_image_url: config.is_maintenance ? (config.custom_image_url || '') : '',
      updated_at: config.updated_at,
      activated_at: config.is_maintenance ? (config.activated_at || config.updated_at || '') : '',
      epoch: config.epoch || 1,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

// 🛡️ 供團長後台控制開關與修改維護公告 (具備嚴格安全鑑權與長度防禦)
export async function POST(req: NextRequest) {
  // 1. 驗證 CSRF 同源性
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  if (host && origin) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ success: false, message: '跨來源請求被拒' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ success: false, message: '不合法的請求來源' }, { status: 403 });
    }
  }

  // 2. 驗證團長認證 Token (防範未授權訪客或機器人惡意開關/竄改維護設定)
  const token = req.cookies.get('meinu_admin_token')?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { success: false, message: '存取被拒：未經授權的操作，請先解鎖團長後台！' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const current = readMaintenanceConfig();

    // 3. 嚴格 Payload 字串長度限制與協議防禦
    const rawTitle = typeof body.title === 'string' ? body.title.trim().slice(0, 100) : current.title;
    const rawMessage = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : current.message;
    const rawEstimated =
      typeof body.estimated_end_time === 'string'
        ? body.estimated_end_time.trim().slice(0, 60)
        : current.estimated_end_time;
    const rawReason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 50) : current.reason;

    // 4. 維護範圍校驗 (支援複選多頁面或全站)
    let rawScopes: MaintenanceScope[] = [];
    if (Array.isArray(body.scopes) && body.scopes.length > 0) {
      rawScopes = body.scopes.filter((s: any) => VALID_SCOPES.includes(s));
    }

    // 若未傳入 scopes，則兼容舊版 body.scope
    if (rawScopes.length === 0) {
      const singleScope: MaintenanceScope = VALID_SCOPES.includes(body.scope) ? body.scope : (current.scope || 'all');
      rawScopes = [singleScope];
    }

    // 若包含 'all'，則規範為 ['all']
    if (rawScopes.includes('all')) {
      rawScopes = ['all'];
    }

    const primaryScope: MaintenanceScope = rawScopes[0] || 'all';

    let rawCustomImage = current.custom_image_url || '';
    if (typeof body.custom_image_url === 'string') {
      const imgCandidate = body.custom_image_url.trim();
      // 僅允許標準 HTTP(S) 或 data:image/ 安全協議，封鎖 javascript: 或其他危險偽協定
      if (!imgCandidate || /^https?:\/\//i.test(imgCandidate) || /^data:image\//i.test(imgCandidate)) {
        rawCustomImage = imgCandidate.slice(0, 500000); // 允許 Base64 圖片但限制最大長度
      }
    }

    const willBeMaintenance = typeof body.is_maintenance === 'boolean' ? body.is_maintenance : current.is_maintenance;
    const nowIso = new Date().toISOString();
    let activatedAt = '';
    if (willBeMaintenance) {
      if (current.is_maintenance && current.activated_at) {
        activatedAt = current.activated_at;
      } else {
        activatedAt = nowIso;
      }
    }

    const nextEpoch = (current.epoch || 0) + 1;

    const updatedConfig: MaintenanceConfig = {
      is_maintenance: willBeMaintenance,
      scope: primaryScope,
      scopes: rawScopes,
      title: rawTitle,
      message: rawMessage,
      estimated_end_time: rawEstimated,
      reason: rawReason,
      custom_image_url: rawCustomImage,
      updated_at: nowIso,
      activated_at: activatedAt,
      epoch: nextEpoch,
    };

    const success = writeMaintenanceConfig(updatedConfig);
    if (!success) {
      return NextResponse.json({ success: false, message: '儲存設定失敗' }, { status: 500 });
    }

    const scopeLabels: Record<MaintenanceScope, string> = {
      all: '全站所有頁面',
      home: '首頁大廳',
      search: '探索搜尋頁',
      stores: '店家菜單頁',
      cart: '購物車頁',
      checkout: '結帳送單頁',
      'my-orders': '歷史訂單頁',
      account: '會員專區頁',
      legal: '法律協議中心',
    };

    const formattedScopeNames = rawScopes.includes('all')
      ? '全站所有頁面'
      : rawScopes.map((s) => scopeLabels[s] || s).join('、');

    const res = NextResponse.json({
      success: true,
      message: updatedConfig.is_maintenance
        ? `已開啟「${formattedScopeNames}」系統維護模式`
        : '已關閉維護模式，前台恢復正常點餐',
      config: updatedConfig,
      build_id: process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
    });

    if (updatedConfig.is_maintenance) {
      res.cookies.set('meinu_maintenance', 'true', {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
      });
      res.cookies.set('meinu_maintenance_scope', updatedConfig.scope || 'all', {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
      });
      res.cookies.set('meinu_maintenance_epoch', String(updatedConfig.epoch || 1), {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
      });
    } else {
      res.cookies.set('meinu_maintenance', '', {
        path: '/',
        maxAge: 0,
      });
      res.cookies.set('meinu_maintenance_scope', '', {
        path: '/',
        maxAge: 0,
      });
      res.cookies.set('meinu_maintenance_epoch', '', {
        path: '/',
        maxAge: 0,
      });
    }

    return res;
  } catch (err: any) {
    console.error('更新維護狀態出錯:', err);
    return NextResponse.json({ success: false, message: err?.message || '伺服端錯誤' }, { status: 500 });
  }
}
