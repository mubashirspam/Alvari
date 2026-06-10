import { MessageSquareReply } from "lucide-react";
import { getProductReviews } from "../services/review-service";
import { ReviewForm } from "./review-form";
import { StarRating } from "./star-rating";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Full reviews block for the product page: summary, list, write-a-review. */
export async function ReviewsSection({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const { reviews, summary } = await getProductReviews(productId);

  return (
    <section id="reviews" className="mt-20">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
        Customer reviews
      </p>
      <h2 className="font-serif text-[28px] tracking-[-0.02em] text-[var(--color-ink)] md:text-[34px]">
        {summary.count > 0
          ? `Rated ${summary.average} out of 5`
          : "Be the first to review"}
      </h2>

      <div className="mt-8 grid gap-10 md:grid-cols-[320px_1fr] md:gap-14">
        {/* Left: summary + form */}
        <div className="space-y-8">
          {summary.count > 0 && (
            <div>
              <div className="flex items-end gap-3">
                <span className="font-serif text-[56px] leading-none text-[var(--color-ink)]">
                  {summary.average}
                </span>
                <div className="pb-1.5">
                  <StarRating value={summary.average} size={18} />
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {summary.count} review{summary.count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Distribution bars */}
              <div className="mt-5 space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = summary.distribution[`${star}`];
                  const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                      <span className="w-3 text-right">{star}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-soft)]">
                        <div
                          className="h-full rounded-full bg-[#E8A838]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <ReviewForm productSlug={productSlug} />
        </div>

        {/* Right: review list */}
        <div>
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
              No reviews yet — share your experience with this piece.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {reviews.map((review) => (
                <li key={review.id} className="py-7 first:pt-0">
                  <div className="flex items-start gap-4">
                    {/* Initial avatar */}
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-soft)] font-serif text-base text-[var(--color-ink)]">
                      {review.authorName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-medium text-[var(--color-ink)]">
                          {review.authorName}
                        </p>
                        <span className="text-xs text-[var(--color-muted)]">
                          {DATE_FMT.format(review.createdAt)}
                        </span>
                      </div>
                      <StarRating value={review.rating} size={14} className="mt-1" />

                      {review.highlights.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {review.highlights.map((h) => (
                            <span
                              key={h}
                              className="rounded-full bg-[var(--color-bg-soft)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]">
                        {review.comment}
                      </p>

                      {/* Admin reply */}
                      {review.adminReply && (
                        <div className="mt-4 rounded-xl bg-[var(--color-bg-soft)] p-4">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                            <MessageSquareReply className="h-3.5 w-3.5" />
                            Response from Alvari
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
                            {review.adminReply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
