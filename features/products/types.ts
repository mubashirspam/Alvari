import type { ProductRow } from "@/lib/db/schema";

export type ProductCategory = ProductRow["category"];
export type ProductBadge = NonNullable<ProductRow["badge"]>;

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  meta: string;
  description: string;
  priceNow: number;
  priceWas: number;
  discountPercent: number;
  badge: ProductBadge | null;
  illustrationKey: string;
  imageUrl: string | null;
  gradientFrom: string;
  gradientTo: string;
  isFeatured: boolean;
  sortOrder: number;
};

export function mapProductRow(row: ProductRow): Product {
  const priceNow = row.priceNowInPaise / 100;
  const priceWas = row.priceWasInPaise / 100;
  const discountPercent = Math.round(((priceWas - priceNow) / priceWas) * 100);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    meta: row.meta,
    description: row.description,
    priceNow,
    priceWas,
    discountPercent,
    badge: row.badge,
    illustrationKey: row.illustrationKey,
    imageUrl: row.imageUrl,
    gradientFrom: row.gradientFrom,
    gradientTo: row.gradientTo,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
  };
}

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  almirah: "Almirah / Wardrobe",
  bed: "Bed",
  sofa: "Sofa Setti",
  dining: "Dining Set",
  dressing: "Dressing Table",
  coffee_table: "Coffee Table",
  mattress: "Mattress",
  room_set: "Complete Room Set",
  custom: "Custom / Other",
};

export const BADGE_LABEL: Record<ProductBadge, string> = {
  bestseller: "Bestseller",
  new: "New",
  trending: "Trending",
  value_pick: "Value Pick",
  best_value: "Best Value",
};

export const HOT_BADGES: ReadonlySet<ProductBadge> = new Set([
  "bestseller",
  "trending",
  "best_value",
]);
