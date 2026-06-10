"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_HIGHLIGHTS, type ReviewHighlight } from "../schema";

const RATING_LABEL: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

export function ReviewForm({ productSlug }: { productSlug: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [highlights, setHighlights] = useState<ReviewHighlight[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function toggleHighlight(h: ReviewHighlight) {
    setHighlights((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      const honeypot =
        (new FormData(e.currentTarget).get("website") as string) ?? "";
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          authorName,
          rating,
          highlights,
          comment,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message ?? "Could not save your review — please try again.");
        return;
      }
      setSubmitted(true);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-8">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="font-medium text-[var(--color-ink)]">
            Thank you for your review!
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            It&apos;s live on this page now.
          </p>
        </div>
      </div>
    );
  }

  const activeRating = hovered || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 md:p-8"
    >
      <h3 className="font-serif text-[22px] tracking-[-0.02em] text-[var(--color-ink)]">
        Write a review
      </h3>

      {/* Star picker */}
      <div className="mt-5">
        <Label>Your rating</Label>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= activeRating
                      ? "fill-[#E8A838] text-[#E8A838]"
                      : "text-[var(--color-line)]"
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {activeRating > 0 && (
            <span className="text-sm text-[var(--color-muted)]">
              {RATING_LABEL[activeRating]}
            </span>
          )}
        </div>
      </div>

      {/* Quick-phrase chips */}
      <div className="mt-5">
        <Label>What stood out? (tap any)</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {REVIEW_HIGHLIGHTS.map((h) => {
            const selected = highlights.includes(h);
            return (
              <button
                key={h}
                type="button"
                onClick={() => toggleHighlight(h)}
                aria-pressed={selected}
                className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                  selected
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                    : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="review-name">Your name</Label>
        <Input
          id="review-name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          autoComplete="name"
          maxLength={60}
          required
        />
      </div>

      <div className="mt-4">
        <Label htmlFor="review-comment">Your review</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          minLength={10}
          maxLength={2000}
          placeholder="How is the quality? Was delivery smooth? Would you recommend it?"
          required
        />
      </div>

      {/* Honeypot — hidden from real users, catches naive bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-8 py-3.5 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          "Submit review"
        )}
      </button>
    </form>
  );
}
