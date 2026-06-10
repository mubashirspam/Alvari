import type { ProductReviewRow, ReviewStatus } from "@/lib/db/schema";
import { cached, invalidate, rateLimit } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import { adminReviewActionSchema, createReviewSchema } from "../schema";
import * as repo from "../repositories/review-repository";
import type { AdminReviewListItem, ProductReviewsPayload } from "../types";

/** Approved reviews + aggregate for a product page (cached). */
export async function getProductReviews(
  productId: string,
): Promise<ProductReviewsPayload> {
  return cached(cacheKeys.reviewsByProduct(productId), cacheTtl.reviews, async () => {
    const [reviews, summary] = await Promise.all([
      repo.findApprovedByProduct(productId),
      repo.summaryByProduct(productId),
    ]);
    return { reviews, summary };
  });
}

export class ReviewRateLimitError extends Error {
  constructor() {
    super("You're reviewing too fast — please try again in a little while.");
  }
}

export async function submitReview(
  raw: unknown,
  clientIp: string,
): Promise<ProductReviewRow> {
  const input = createReviewSchema.parse(raw);

  // 2 reviews/minute and 5/day per IP keeps spam manageable without
  // blocking households behind one IP.
  const [burstOk, dailyOk] = await Promise.all([
    rateLimit(`reviews:burst:${clientIp}`, 2, 60),
    rateLimit(`reviews:daily:${clientIp}`, 5, 60 * 60 * 24),
  ]);
  if (!burstOk || !dailyOk) throw new ReviewRateLimitError();

  const productId = await repo.findProductIdBySlug(input.productSlug);
  if (!productId) throw new Error("Product not found");

  const row = await repo.insert({
    productId,
    authorName: input.authorName,
    rating: input.rating,
    highlights: input.highlights,
    comment: input.comment,
  });
  await invalidate(cacheKeys.reviewsByProduct(productId));
  return row;
}

/* ── admin ─────────────────────────────────────────────────────────────── */

export async function adminListReviews(
  status?: ReviewStatus,
): Promise<AdminReviewListItem[]> {
  return repo.adminFindAll(status);
}

export async function adminActOnReview(
  id: string,
  raw: unknown,
): Promise<ProductReviewRow | null> {
  const action = adminReviewActionSchema.parse(raw);
  let row: ProductReviewRow | null = null;
  if (action.action === "reply") row = await repo.setReply(id, action.reply);
  else row = await repo.setStatus(id, action.action === "hide" ? "hidden" : "approved");
  if (row) await invalidate(cacheKeys.reviewsByProduct(row.productId));
  return row;
}

export async function adminDeleteReview(
  id: string,
): Promise<ProductReviewRow | null> {
  const row = await repo.remove(id);
  if (row) await invalidate(cacheKeys.reviewsByProduct(row.productId));
  return row;
}
