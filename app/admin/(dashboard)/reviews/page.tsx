import Link from "next/link";
import { ReviewModerationCard } from "@/features/admin/components/review-moderation-card";
import { adminListReviews } from "@/features/reviews/services/review-service";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "approved", label: "Live" },
  { value: "hidden", label: "Hidden" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;
  const filter =
    status === "approved" || status === "hidden" ? status : undefined;
  const reviews = await adminListReviews(filter);

  const avg =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
        ) / 10
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
            {reviews.length > 0 ? ` · ${avg} average` : ""} — reply publicly,
            hide, or delete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const href = f.value
              ? `/admin/reviews?status=${f.value}`
              : "/admin/reviews";
            return (
              <Link
                key={f.label}
                href={href}
                className={`rounded-full border px-4 py-2 text-xs tracking-wide transition ${
                  active
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          {filter
            ? `No ${filter === "approved" ? "live" : "hidden"} reviews.`
            : "No reviews yet — they'll appear here as customers post them."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
