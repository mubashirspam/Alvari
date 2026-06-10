"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquareReply,
  Trash2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/features/reviews/components/star-rating";
import type { AdminReviewListItem } from "@/features/reviews/types";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ReviewModerationCard({ review }: { review: AdminReviewListItem }) {
  const router = useRouter();
  const [reply, setReply] = useState(review.adminReply ?? "");
  const [replyOpen, setReplyOpen] = useState(false);
  const [busy, setBusy] = useState<"reply" | "visibility" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(body: object, kind: "reply" | "visibility") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message ?? "Update failed");
        return;
      }
      setReplyOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete this review by ${review.authorName}? This cannot be undone.`)) {
      return;
    }
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(null);
    }
  }

  const hidden = review.status === "hidden";

  return (
    <div
      className={`rounded-2xl border border-[var(--color-line)] p-6 transition ${hidden ? "bg-[var(--color-bg-soft)] opacity-75" : "bg-[var(--color-bg)]"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-medium text-[var(--color-ink)]">{review.authorName}</p>
            <StarRating value={review.rating} size={14} />
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                hidden
                  ? "bg-[var(--color-line)] text-[var(--color-muted)]"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {hidden ? "Hidden" : "Live"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            on{" "}
            <Link
              href={`/products/${review.productSlug}#reviews`}
              target="_blank"
              className="underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
            >
              {review.productName}
            </Link>{" "}
            · {DATE_FMT.format(new Date(review.createdAt))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => act({ action: hidden ? "show" : "hide" }, "visibility")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-ink)] transition hover:border-[var(--color-accent)] disabled:opacity-50"
          >
            {busy === "visibility" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : hidden ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {hidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            {busy === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>

      {review.highlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
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

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink)]">{review.comment}</p>

      {/* Existing reply */}
      {review.adminReply && !replyOpen && (
        <div className="mt-4 rounded-xl bg-[var(--color-bg-soft)] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <MessageSquareReply className="h-3.5 w-3.5" /> Your reply
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-ink)]">{review.adminReply}</p>
        </div>
      )}

      {/* Reply editor */}
      {replyOpen ? (
        <div className="mt-4">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Write a public response as Alvari…"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => act({ action: "reply", reply }, "reply")}
              disabled={busy !== null || reply.trim().length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 py-2 text-xs text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-50"
            >
              {busy === "reply" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {review.adminReply ? "Update reply" : "Post reply"}
            </button>
            <button
              type="button"
              onClick={() => {
                setReplyOpen(false);
                setReply(review.adminReply ?? "");
              }}
              className="rounded-full px-4 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setReplyOpen(true)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
        >
          <MessageSquareReply className="h-3.5 w-3.5" />
          {review.adminReply ? "Edit reply" : "Reply to this review"}
        </button>
      )}

      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}
