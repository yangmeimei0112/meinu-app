export interface OrderItemAdmin {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

export interface OrderSubmissionAdmin {
  id: string;
  group_order_id?: string;
  store_id?: string;
  store_name?: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  signature_data: string | null;
  signature_url?: string | null;
  progress_status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  order_items: OrderItemAdmin[];
}

export interface GroupOrderAdmin {
  id: string;
  store_id: string;
  title: string;
  status: 'open' | 'closed' | 'completed';
  announcement: string | null;
  delivery_fee: number;
  discount_amount: number;
  rounding_rule: string;
  enable_min_threshold?: boolean;
  min_threshold_amount?: number;
  enable_countdown?: boolean;
  cutoff_time?: string | null;
  enable_budget_limit?: boolean;
  budget_limit_amount?: number;
  stores?: { name: string; code?: string } | null;
  order_count?: number;
  total_sales?: number;
  created_at?: string;
}

export type AdminViewMode = 'desktop' | 'mobile';

export type AdminTabType = 'active' | 'crud' | 'archive' | 'maintenance';

export interface AdminConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

export type { Store, Category, MenuItem, PaymentMethod, SoldOutOption } from '@/types/database';
