export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Store {
  id: string;
  category_id: string | null;
  name: string;
  image_url: string | null;
  is_active: boolean;
}

export interface CustomOption {
  id: string;
  name: string;
  price_adjustment: number;
}

export interface CustomGroup {
  id: string;
  title: string;
  type: 'single' | 'any' | 'limit'; // Must 1 (single), Any, Limit N (limit)
  limit_number?: number;
  options: CustomOption[];
}

export interface MenuItem {
  id: string;
  store_id: string;
  name: string;
  price: number;
  description: string | null;
  is_sold_out: boolean;
  stock_quantity: number | null;
  custom_groups?: CustomGroup[] | null;
  sort_order?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  account_info: string | null;
  is_active: boolean;
}

export interface SoldOutOption {
  id: string;
  title: string;
  sort_order: number;
}

export interface GroupOrder {
  id: string;
  store_id: string;
  title: string;
  status: 'open' | 'closed' | 'completed';
  announcement?: string | null;
  enable_min_threshold?: boolean;
  min_threshold_amount?: number;
  enable_countdown?: boolean;
  cutoff_time?: string | null;
  enable_budget_limit?: boolean;
  budget_limit_amount?: number;
  delivery_fee?: number;
  discount_amount?: number;
  rounding_rule?: 'floor' | 'ceil' | 'round';
  created_at?: string;
}

export interface OrderItemOption {
  id: string;
  order_item_id: string;
  option_name: string;
  extra_price: number;
}

export interface OrderItem {
  id: string;
  submission_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  custom_notes: string | null;
  order_item_options?: OrderItemOption[];
}

export interface OrderSubmission {
  id: string;
  group_order_id: string;
  order_number: string;
  user_nickname: string;
  payment_method_name: string;
  sold_out_option: string | null;
  total_amount: number;
  final_amount: number;
  is_paid: boolean;
  signature_data?: string | null;
  created_at: string;
  order_items?: OrderItem[];
}