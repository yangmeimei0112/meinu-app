export interface SelectedOption {
  groupTitle: string;
  itemName: string;
  extraPrice: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  storeId: string;
  storeName: string;
  name: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  customNotes: string;
  totalPrice: number;
}

// 多店家購物車結構：key 為 storeId
export interface StoreCartGroup {
  storeId: string;
  storeName: string;
  items: CartItem[];
}

export type MultiStoreCart = Record<string, StoreCartGroup>;