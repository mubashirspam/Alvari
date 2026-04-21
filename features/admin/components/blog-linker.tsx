"use client";

import { useState } from "react";
import type { BlogPostRow } from "@/lib/db/schema";

type Props = {
  productId: string;
  allPosts: BlogPostRow[];
  linkedIds: string[];
};

export function BlogLinker({ productId, allPosts, linkedIds }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(linkedIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/blogs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogPostIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error((await res.json() as { message: string }).message);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        Check the blog posts you want to appear as &ldquo;From the manufacturer&rdquo; sections on this product page.
      </p>

      <div className="space-y-2">
        {allPosts.map((post) => (
          <label
            key={post.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-line)] p-4 hover:border-[var(--color-accent)]"
          >
            <input
              type="checkbox"
              checked={selected.has(post.id)}
              onChange={() => toggle(post.id)}
              className="mt-0.5 h-4 w-4"
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {post.title}
                {!post.isPublished && (
                  <span className="ml-2 rounded-full bg-[var(--color-bg-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    draft
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {post.excerpt ?? `/${post.slug}`}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[var(--color-ink)] px-7 py-3 text-xs uppercase tracking-widest text-[var(--color-bg)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save links"}
        </button>
        {saved && <span className="text-sm text-[var(--color-accent)]">Saved!</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
