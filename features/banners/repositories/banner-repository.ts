import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  banners,
  type BannerRow,
  type NewBannerRow,
} from "@/lib/db/schema";

export async function findBySlot(
  slot: BannerRow["slot"],
): Promise<BannerRow[]> {
  return db
    .select()
    .from(banners)
    .where(and(eq(banners.slot, slot), eq(banners.isActive, true)))
    .orderBy(asc(banners.sortOrder));
}

export async function findAll(): Promise<BannerRow[]> {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.slot), asc(banners.sortOrder));
}

export async function findById(id: string): Promise<BannerRow | null> {
  const rows = await db
    .select()
    .from(banners)
    .where(eq(banners.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function insert(row: NewBannerRow): Promise<BannerRow> {
  const inserted = await db.insert(banners).values(row).returning();
  if (!inserted[0]) throw new Error("Failed to insert banner");
  return inserted[0];
}

export async function update(
  id: string,
  changes: Partial<NewBannerRow>,
): Promise<BannerRow | null> {
  const updated = await db
    .update(banners)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(banners.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function remove(id: string): Promise<void> {
  await db.delete(banners).where(eq(banners.id, id));
}

export async function upsertBySlug(row: NewBannerRow): Promise<BannerRow> {
  if (!row.slug) throw new Error("upsertBySlug requires slug");
  const inserted = await db
    .insert(banners)
    .values(row)
    .onConflictDoUpdate({
      target: banners.slug,
      set: { ...row, updatedAt: new Date() },
    })
    .returning();
  if (!inserted[0]) throw new Error("Failed to upsert banner");
  return inserted[0];
}
