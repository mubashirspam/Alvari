import type { CategoryRow, ProductRow } from "@/lib/db/schema";

export type Category = {
  category: CategoryRow["category"];
  label: string;
  slug: string;
  subtitle: string | null;
  imageKey: string | null;
  heroImageKey: string | null;
  accentColor: string | null;
  sortOrder: number;
  isVisible: boolean;
};

export function mapCategory(row: CategoryRow): Category {
  return {
    category: row.category,
    label: row.label,
    slug: row.slug,
    subtitle: row.subtitle,
    imageKey: row.imageKey,
    heroImageKey: row.heroImageKey,
    accentColor: row.accentColor,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

export type ProductCategoryValue = ProductRow["category"];
