export type CartItem = {
  /** Stable key — productId + variantId (or "default" if no variant chosen). */
  key: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string | null;
  variantSku: string | null;
  variantName: string | null;
  /** Unit price in rupees (the same number we display via formatINR). */
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  /** instant = pay online at listed price; quote = team confirms final price. */
  purchaseMode: "instant" | "quote";
  /** Listed price is a starting point — blocks online payment (checkout rules). */
  priceIsIndicative: boolean;
};

export function cartHasQuoteItems(items: CartItem[]): boolean {
  return items.some((i) => i.purchaseMode === "quote");
}

export function cartIsMixed(items: CartItem[]): boolean {
  return (
    items.some((i) => i.purchaseMode === "quote") &&
    items.some((i) => i.purchaseMode === "instant")
  );
}

export function makeCartKey(productId: string, variantId: string | null): string {
  return `${productId}::${variantId ?? "default"}`;
}
