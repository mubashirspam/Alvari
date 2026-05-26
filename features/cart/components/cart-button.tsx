"use client";

import { ShoppingBag } from "lucide-react";
import { useCart, cartItemCount } from "../store";

export function CartButton({ className = "" }: { className?: string }) {
  const items = useCart((s) => s.items);
  const hasHydrated = useCart((s) => s.hasHydrated);
  const open = useCart((s) => s.open);
  const count = hasHydrated ? cartItemCount(items) : 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
      className={`relative inline-flex items-center justify-center rounded-full border border-[var(--color-line)] p-2 text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] ${className}`}
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-medium leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
