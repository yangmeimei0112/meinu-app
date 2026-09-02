export type OrderProgressStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderProgressStep {
  key: OrderProgressStatus;
  label: string;
  stepNumber: number;
  description: string;
}

export const ORDER_PROGRESS_STEPS: OrderProgressStep[] = [
  { key: 'pending', label: '已送單', stepNumber: 1, description: '訂單已送出，待確認' },
  { key: 'preparing', label: '備餐中', stepNumber: 2, description: '店家已接單，製作中' },
  { key: 'ready', label: '待取餐', stepNumber: 3, description: '餐點備妥，請取餐' },
  { key: 'completed', label: '已完成', stepNumber: 4, description: '已取餐，用餐愉快' },
];

export interface OrderStatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  title: string;
  description: string;
  stepIndex: number;
}

export const ORDER_STATUS_META: Record<OrderProgressStatus, OrderStatusConfig> = {
  pending: {
    label: '待確認',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    title: '訂單已送出，等待店家確認',
    description: '系統已接收您的訂單，店家正準備排單處理中...',
    stepIndex: 0,
  },
  preparing: {
    label: '製作中',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800/60',
    title: '店家接單中，美味精心製作',
    description: '您的餐點正在熱烈烹調製作中，請稍候片刻！',
    stepIndex: 1,
  },
  ready: {
    label: '待取餐',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800/60',
    title: '餐點已備妥，請前往取餐！',
    description: '熱騰騰的餐點已準備完成，請儘速前往領取或等待外送員送達。',
    stepIndex: 2,
  },
  completed: {
    label: '已完成',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
    title: '訂單已圓滿完成！',
    description: '感謝您的訂購，祝您用餐愉快！',
    stepIndex: 3,
  },
  cancelled: {
    label: '已取消',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    title: '此筆訂單已取消',
    description: '該訂單已被取消，如有疑問請聯繫團長或店家協助。',
    stepIndex: -1,
  },
};

/**
 * 🛡️ 從 signature_url 解析訂單進度狀態
 */
export function parseOrderProgressStatus(signatureUrl?: string | null): OrderProgressStatus {
  if (!signatureUrl) return 'pending';
  try {
    const trimmed = signatureUrl.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.status && ['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(parsed.status)) {
        return parsed.status as OrderProgressStatus;
      }
    }
    if (['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(trimmed)) {
      return trimmed as OrderProgressStatus;
    }
  } catch {}
  return 'pending';
}

/**
 * 📦 序列化訂單進度狀態為 JSON 儲存於 signature_url
 */
export function serializeOrderProgressStatus(status: OrderProgressStatus, note?: string): string {
  return JSON.stringify({
    status,
    note: note || '',
    updated_at: new Date().toISOString(),
  });
}
