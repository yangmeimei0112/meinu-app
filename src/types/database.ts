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

export interface MenuItem {
  id: string;
  store_id: string;
  name: string;
  price: number;
  description: string | null;
  is_sold_out: boolean;
  stock_quantity: number | null;
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