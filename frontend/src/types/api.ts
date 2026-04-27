export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
}

export interface Supplier {
  id: number;
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location?: string | null;
  is_active: boolean;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  tax_rate: number;
  low_stock_threshold: number;
  is_active: boolean;
  category_id?: number | null;
  supplier_id?: number | null;
}

export interface ProductWithStock extends Product {
  on_hand: number;
  is_low_stock: boolean;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer';

export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  type: MovementType;
  quantity: number;
  unit_cost?: number | null;
  reference?: string | null;
  note?: string | null;
  user_id?: number | null;
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  active_products: number;
  total_warehouses: number;
  total_suppliers: number;
  low_stock_count: number;
  total_stock_value: number;
  total_units_on_hand: number;
}

export interface TopProduct {
  product_id: number;
  sku: string;
  name: string;
  units_moved: number;
}
