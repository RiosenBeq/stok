'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  menu_item_id: number;
  sku: string;
  name: string;
  unit_price: number;
  quantity: number;
}

interface CartState {
  warehouseId: number | null;
  lines: CartLine[];
  setWarehouse: (id: number | null) => void;
  add: (line: Omit<CartLine, 'quantity'>) => void;
  setQty: (menu_item_id: number, quantity: number) => void;
  remove: (menu_item_id: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      warehouseId: null,
      lines: [],
      setWarehouse: (id) => set({ warehouseId: id }),
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.menu_item_id === line.menu_item_id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.menu_item_id === line.menu_item_id
                  ? { ...l, quantity: l.quantity + 1 }
                  : l
              ),
            };
          }
          return { lines: [...s.lines, { ...line, quantity: 1 }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.menu_item_id !== id)
              : s.lines.map((l) =>
                  l.menu_item_id === id ? { ...l, quantity: qty } : l
                ),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.menu_item_id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'stok-cart' }
  )
);

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
