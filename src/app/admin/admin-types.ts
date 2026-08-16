export interface OrderItemAdmin {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
}

export interface OrderSubmissionAdmin {
  id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  signature_data: string | null;
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
}

export type AdminViewMode = 'desktop' | 'mobile';


