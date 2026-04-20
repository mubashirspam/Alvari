import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, type ProductRow } from "@/lib/db/schema";

export async function findFeatured(limit: number): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.isFeatured, true))
    .orderBy(asc(products.sortOrder), desc(products.createdAt))
    .limit(limit);
}

export async function findAll(): Promise<ProductRow[]> {
  return db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
}

export async function findBySlug(slug: string): Promise<ProductRow | null> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}
