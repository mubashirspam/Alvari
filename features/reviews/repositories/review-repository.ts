import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  productReviews,
  products,
  type NewProductReviewRow,
  type ProductReviewRow,
  type ReviewStatus,
} from "@/lib/db/schema";
import type { AdminReviewListItem, ReviewSummary } from "../types";

export async function findProductIdBySlug(
  slug: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function findApprovedByProduct(
  productId: string,
): Promise<ProductReviewRow[]> {
  return db
    .select()
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.status, "approved"),
      ),
    )
    .orderBy(desc(productReviews.createdAt));
}

export async function summaryByProduct(
  productId: string,
): Promise<ReviewSummary> {
  const rows = await db
    .select({
      rating: productReviews.rating,
      count: sql<number>`count(*)::int`,
    })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.status, "approved"),
      ),
    )
    .groupBy(productReviews.rating);

  const distribution: ReviewSummary["distribution"] = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
  let total = 0;
  let weighted = 0;
  for (const r of rows) {
    const key = String(r.rating) as keyof ReviewSummary["distribution"];
    if (key in distribution) distribution[key] = r.count;
    total += r.count;
    weighted += r.rating * r.count;
  }
  return {
    count: total,
    average: total > 0 ? Math.round((weighted / total) * 10) / 10 : 0,
    distribution,
  };
}

export async function insert(
  data: NewProductReviewRow,
): Promise<ProductReviewRow> {
  const [row] = await db.insert(productReviews).values(data).returning();
  return row;
}

export async function findById(id: string): Promise<ProductReviewRow | null> {
  const rows = await db
    .select()
    .from(productReviews)
    .where(eq(productReviews.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function adminFindAll(
  status?: ReviewStatus,
): Promise<AdminReviewListItem[]> {
  const rows = await db
    .select({
      review: productReviews,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productReviews)
    .innerJoin(products, eq(products.id, productReviews.productId))
    .where(status ? eq(productReviews.status, status) : undefined)
    .orderBy(desc(productReviews.createdAt));
  return rows.map((r) => ({
    ...r.review,
    productName: r.productName,
    productSlug: r.productSlug,
  }));
}

export async function setStatus(
  id: string,
  status: ReviewStatus,
): Promise<ProductReviewRow | null> {
  const [row] = await db
    .update(productReviews)
    .set({ status, updatedAt: new Date() })
    .where(eq(productReviews.id, id))
    .returning();
  return row ?? null;
}

export async function setReply(
  id: string,
  reply: string,
): Promise<ProductReviewRow | null> {
  const [row] = await db
    .update(productReviews)
    .set({ adminReply: reply, adminRepliedAt: new Date(), updatedAt: new Date() })
    .where(eq(productReviews.id, id))
    .returning();
  return row ?? null;
}

export async function remove(id: string): Promise<ProductReviewRow | null> {
  const [row] = await db
    .delete(productReviews)
    .where(eq(productReviews.id, id))
    .returning();
  return row ?? null;
}
