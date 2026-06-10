import type { ProductReviewRow } from "@/lib/db/schema";

/** Aggregate shown in the summary header and in product JSON-LD. */
export type ReviewSummary = {
  average: number;
  count: number;
  /** Count per star value, keys "1"–"5". */
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
};

/** Payload cached per product for the public product page. */
export type ProductReviewsPayload = {
  reviews: ProductReviewRow[];
  summary: ReviewSummary;
};

/** Admin list row — review plus the product it belongs to. */
export type AdminReviewListItem = ProductReviewRow & {
  productName: string;
  productSlug: string;
};
