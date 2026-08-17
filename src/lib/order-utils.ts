import { SupabaseClient } from '@supabase/supabase-js';

/**
 * 🔢 規律化循序單號生成器 (MN-001, MN-002, MN-003 ...)
 * 查詢特定團購活動內現有之單號，解析規律序號並依序遞增。
 * 格式保證為 MN-xxx（三位數補零，如 MN-001；超過 999 則自動拓展為 MN-1000）。
 *
 * @param supabase Supabase 客戶端實例
 * @param groupOrderId 當前團購活動 ID
 * @returns 格式化的循序單號，例如 "MN-001"
 */
export async function generateSequentialOrderNumber(
  supabase: SupabaseClient,
  groupOrderId: string
): Promise<string> {
  try {
    const { data: existingOrders, error } = await supabase
      .from('order_submissions')
      .select('order_number')
      .eq('group_order_id', groupOrderId);

    if (error || !existingOrders || existingOrders.length === 0) {
      return 'MN-001';
    }

    // 解析出所有已有的規律數字序號（過濾掉過去舊版的時間戳隨機單號）
    const seqNumbers = existingOrders
      .map((item) => {
        if (!item.order_number) return 0;
        // 匹配 MN-001, MN-002, MN-1, MN-MANUAL-001 等 1~4 位正規序號
        const match = item.order_number.match(/MN-(?:MANUAL-)?(\d{1,4})$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n) && n > 0 && n <= 9999);

    let nextSeq = 1;
    if (seqNumbers.length > 0) {
      nextSeq = Math.max(...seqNumbers) + 1;
    } else {
      nextSeq = existingOrders.length + 1;
    }

    // 格式化為三位數補零：MN-001, MN-002, MN-010, MN-100...
    const formattedSeq = nextSeq < 1000 ? String(nextSeq).padStart(3, '0') : String(nextSeq);
    return `MN-${formattedSeq}`;
  } catch (err) {
    console.error('生成循序單號失敗，使用預設單號備案:', err);
    return 'MN-001';
  }
}
