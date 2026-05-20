import * as repo from "@/features/categories/repositories/category-repository";
import { mapCategory, type Category } from "@/features/categories/types";
import { cached, invalidate } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import type { CategoryRow, NewCategoryRow } from "@/lib/db/schema";

export async function getVisibleCategories(): Promise<Category[]> {
  return cached(cacheKeys.categoriesVisible, cacheTtl.categories, async () => {
    const rows = await repo.findVisible();
    return rows.map(mapCategory);
  });
}

export async function getAllCategories(): Promise<Category[]> {
  const rows = await repo.findAll();
  return rows.map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const all = await repo.findAll();
  const row = all.find((r) => r.slug === slug);
  return row ? mapCategory(row) : null;
}

export async function updateCategory(
  category: CategoryRow["category"],
  changes: Partial<NewCategoryRow>,
): Promise<Category | null> {
  const updated = await repo.updateByCategory(category, changes);
  await invalidate(cacheKeys.categoriesVisible);
  return updated ? mapCategory(updated) : null;
}
