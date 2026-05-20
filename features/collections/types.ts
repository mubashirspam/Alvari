import type { CollectionRow } from "@/lib/db/schema";
import type { Product } from "@/features/products/types";

export type Collection = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  heroImageKey: string | null;
  accentColor: string | null;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
};

export type CollectionWithProducts = Collection & {
  products: Product[];
};

export function mapCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    heroImageKey: row.heroImageKey,
    accentColor: row.accentColor,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
  };
}
