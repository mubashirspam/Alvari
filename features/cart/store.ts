"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type CartItem, makeCartKey } from "./types";

type AddOptions = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  add: (item: AddOptions) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  _setHasHydrated: (v: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      add: (item) =>
        set((state) => {
          const key = makeCartKey(item.productId, item.variantId);
          const existing = state.items.find((i) => i.key === key);
          const addQty = item.quantity ?? 1;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + addQty } : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, key, quantity: addQty }],
            isOpen: true,
          };
        }),
      remove: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.key !== key) };
          }
          return {
            items: state.items.map((i) =>
              i.key === key ? { ...i, quantity } : i,
            ),
          };
        }),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      _setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "alvari-cart-v1",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?._setHasHydrated(true);
      },
    },
  ),
);

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
