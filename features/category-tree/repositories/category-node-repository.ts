import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categoryNodes,
  type CategoryNodeRow,
  type NewCategoryNodeRow,
} from "@/lib/db/schema";

export async function findAll(): Promise<CategoryNodeRow[]> {
  return db
    .select()
    .from(categoryNodes)
    .orderBy(asc(categoryNodes.sortOrder), asc(categoryNodes.name));
}

export async function findVisible(): Promise<CategoryNodeRow[]> {
  return db
    .select()
    .from(categoryNodes)
    .where(eq(categoryNodes.isVisible, true))
    .orderBy(asc(categoryNodes.sortOrder), asc(categoryNodes.name));
}

export async function findById(id: string): Promise<CategoryNodeRow | null> {
  const rows = await db
    .select()
    .from(categoryNodes)
    .where(eq(categoryNodes.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(row: NewCategoryNodeRow): Promise<CategoryNodeRow> {
  const inserted = await db.insert(categoryNodes).values(row).returning();
  if (!inserted[0]) throw new Error("Failed to create category node");
  return inserted[0];
}

export async function update(
  id: string,
  changes: Partial<NewCategoryNodeRow>,
): Promise<CategoryNodeRow | null> {
  const updated = await db
    .update(categoryNodes)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(categoryNodes.id, id))
    .returning();
  return updated[0] ?? null;
}

/** Deletes the node; the self-referencing FK cascades to its whole subtree. */
export async function remove(id: string): Promise<void> {
  await db.delete(categoryNodes).where(eq(categoryNodes.id, id));
}
