"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../store";
import type { Product, ProductVariant } from "@/features/products/types";

type Variant = Pick<
  ProductVariant,
  "id" | "sku" | "name" | "priceNow"
>;

type Props = {
  product: Pick<Product, "id" | "slug" | "name" | "priceNow" | "imageUrl">;
  variant?: Variant | null;
  imageUrl?: string | null;
  shape?: "icon" | "full";
  label?: string;
  className?: string;
};

export function AddToCartButton({
  product,
  variant,
  imageUrl,
  shape = "icon",
  label,
  className = "",
}: Props) {
  const add = useCart((s) => s.add);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const unitPrice = variant?.priceNow ?? product.priceNow;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: variant?.id ?? null,
      variantSku: variant?.sku ?? null,
      variantName: variant?.name ?? null,
      unitPrice,
      imageUrl: imageUrl ?? product.imageUrl ?? null,
    });
  }

  if (shape === "icon") {
    return (
      <button
        type="button"
        onClick={handleAdd}
        aria-label={`Add ${product.name} to cart`}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)]/95 text-[var(--color-ink)] shadow-sm transition-all duration-300 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] ${className}`}
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--color-navy-deep)] transition-colors hover:bg-[var(--color-accent-warm)] ${className}`}
    >
      <ShoppingBag className="h-4 w-4" />
      {label ?? "Add to quotation"}
    </button>
  );
}
