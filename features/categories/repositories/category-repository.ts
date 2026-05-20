import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  type CategoryRow,
  type NewCategoryRow,
} from "@/lib/db/schema";

export async function findVisible(): Promise<CategoryRow[]> {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(asc(categories.sortOrder), asc(categories.label));
}

export async function findAll(): Promise<CategoryRow[]> {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.label));
}

export async function findByCategory(
  category: CategoryRow["category"],
): Promise<CategoryRow | null> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.category, category))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsert(row: NewCategoryRow): Promise<CategoryRow> {
  const inserted = await db
    .insert(categories)
    .values(row)
    .onConflictDoUpdate({
      target: categories.category,
      set: {
        label: row.label,
        slug: row.slug,
        subtitle: row.subtitle,
        imageKey: row.imageKey,
        heroImageKey: row.heroImageKey,
        accentColor: row.accentColor,
        sortOrder: row.sortOrder ?? 0,
        isVisible: row.isVisible ?? true,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!inserted[0]) throw new Error("Failed to upsert category");
  return inserted[0];
}

export async function updateByCategory(
  category: CategoryRow["category"],
  changes: Partial<NewCategoryRow>,
): Promise<CategoryRow | null> {
  const updated = await db
    .update(categories)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(categories.category, category))
    .returning();
  return updated[0] ?? null;
}
