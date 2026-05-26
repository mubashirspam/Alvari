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
};

export function makeCartKey(productId: string, variantId: string | null): string {
  return `${productId}::${variantId ?? "default"}`;
}
