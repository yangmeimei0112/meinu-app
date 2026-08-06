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