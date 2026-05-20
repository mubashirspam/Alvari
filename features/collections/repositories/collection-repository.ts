import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  collectionProducts,
  collections,
  type CollectionProductRow,
  type CollectionRow,
  type NewCollectionRow,
} from "@/lib/db/schema";

export async function findFeatured(): Promise<CollectionRow[]> {
  return db
    .select()
    .from(collections)
    .where(and(eq(collections.isFeatured, true), eq(collections.isActive, true)))
    .orderBy(asc(collections.sortOrder));
}

export async function findActive(): Promise<CollectionRow[]> {
  return db
    .select()
    .from(collections)
    .where(eq(collections.isActive, true))
    .orderBy(asc(collections.sortOrder));
}

export async function findAll(): Promise<CollectionRow[]> {
  return db.select().from(collections).orderBy(asc(collections.sortOrder));
}

export async function findBySlug(
  slug: string,
): Promise<CollectionRow | null> {
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<CollectionRow | null> {
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findProductIdsForCollections(
  collectionIds: string[],
): Promise<Map<string, { productId: string; sortOrder: number }[]>> {
  if (collectionIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(collectionProducts)
    .where(inArray(collectionProducts.collectionId, collectionIds))
    .orderBy(asc(collectionProducts.sortOrder));
  const byCollection = new Map<
    string,
    { productId: string; sortOrder: number }[]
  >();
  for (const row of rows) {
    const list = byCollection.get(row.collectionId) ?? [];
    list.push({ productId: row.productId, sortOrder: row.sortOrder });
    byCollection.set(row.collectionId, list);
  }
  return byCollection;
}

export async function insert(row: NewCollectionRow): Promise<CollectionRow> {
  const inserted = await db.insert(collections).values(row).returning();
  if (!inserted[0]) throw new Error("Failed to insert collection");
  return inserted[0];
}

export async function update(
  id: string,
  changes: Partial<NewCollectionRow>,
): Promise<CollectionRow | null> {
  const updated = await db
    .update(collections)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(collections.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function remove(id: string): Promise<void> {
  await db.delete(collections).where(eq(collections.id, id));
}

export async function upsertBySlug(
  row: NewCollectionRow,
): Promise<CollectionRow> {
  const inserted = await db
    .insert(collections)
    .values(row)
    .onConflictDoUpdate({
      target: collections.slug,
      set: { ...row, updatedAt: new Date() },
    })
    .returning();
  if (!inserted[0]) throw new Error("Failed to upsert collection");
  return inserted[0];
}

export async function replaceCollectionProducts(
  collectionId: string,
  items: { productId: string; sortOrder: number }[],
): Promise<void> {
  await db
    .delete(collectionProducts)
    .where(eq(collectionProducts.collectionId, collectionId));
  if (items.length === 0) return;
  await db.insert(collectionProducts).values(
    items.map((it) => ({
      collectionId,
      productId: it.productId,
      sortOrder: it.sortOrder,
    })),
  );
}

export async function findCollectionProductsRaw(
  collectionId: string,
): Promise<CollectionProductRow[]> {
  return db
    .select()
    .from(collectionProducts)
    .where(eq(collectionProducts.collectionId, collectionId))
    .orderBy(asc(collectionProducts.sortOrder));
}
