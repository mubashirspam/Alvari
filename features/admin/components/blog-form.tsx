"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/admin/slugify";
import { renderMarkdown } from "@/lib/markdown";
import type { BlogPostRow } from "@/lib/db/schema";

type Props = {
  post?: BlogPostRow;
};

export function BlogForm({ post }: Props) {
  const router = useRouter();
  const isEdit = Boolean(post);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(() =>
    post?.contentMarkdown ? renderMarkdown(post.contentMarkdown) : "",
  );
  const [showPreview, setShowPreview] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEdit && titleRef.current && slugRef.current) {
      const t = titleRef.current;
      const s = slugRef.current;
      const handler = () => { s.value = slugify(t.value); };
      t.addEventListener("input", handler);
      return () => t.removeEventListener("input", handler);
    }
  }, [isEdit]);

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (showPreview) {
      setPreviewHtml(renderMarkdown(e.target.value));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const isPublished = fd.get("isPublished") === "on";

    const body: Record<string, unknown> = {
      slug: fd.get("slug"),
      title: fd.get("title"),
      excerpt: fd.get("excerpt") || null,
      contentMarkdown: fd.get("contentMarkdown"),
      authorName: fd.get("authorName") || "Kaasth",
      readingMinutes: Number(fd.get("readingMinutes") ?? 3),
      isPublished,
      publishedAt: isPublished && !post?.publishedAt ? new Date().toISOString() : (post?.publishedAt?.toISOString() ?? null),
    };

    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/admin/blog/${post!.id}`
        : "/api/admin/blog";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? "Save failed");
      }
      const data = (await res.json()) as { post: BlogPostRow };
      setSuccess(true);
      if (!isEdit) {
        router.replace(`/admin/blog/${data.post.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h3 className="mb-5 font-serif text-[20px] text-[var(--color-ink)]">Post details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="bf-title">Title *</Label>
            <Input id="bf-title" name="title" ref={titleRef} required defaultValue={post?.title} />
          </div>
          <div>
            <Label htmlFor="bf-slug">URL slug *</Label>
            <Input
              id="bf-slug"
              name="slug"
              ref={slugRef}
              required
              defaultValue={post?.slug}
              readOnly={isEdit}
              className={isEdit ? "opacity-60" : ""}
            />
          </div>
          <div>
            <Label htmlFor="bf-author">Author name</Label>
            <Input id="bf-author" name="authorName" defaultValue={post?.authorName ?? "Kaasth"} />
          </div>
          <div>
            <Label htmlFor="bf-mins">Reading time (minutes)</Label>
            <Input id="bf-mins" name="readingMinutes" type="number" min="1" defaultValue={post?.readingMinutes ?? 3} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="bf-excerpt">Excerpt (short summary)</Label>
          <Input id="bf-excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} />
        </div>
        <div className="mt-5 flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? false} className="h-4 w-4" />
            Published (visible on site)
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-[20px] text-[var(--color-ink)]">
            Content <span className="text-sm font-light text-[var(--color-muted)]">(markdown)</span>
          </h3>
          <button
            type="button"
            onClick={() => {
              const showing = !showPreview;
              setShowPreview(showing);
              if (showing && contentRef.current) {
                setPreviewHtml(renderMarkdown(contentRef.current.value));
              }
            }}
            className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
        </div>

        <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : undefined}>
          <textarea
            ref={contentRef}
            name="contentMarkdown"
            required
            rows={20}
            defaultValue={post?.contentMarkdown}
            onChange={handleContentChange}
            placeholder={`## Section title\n\nWrite your content here in **markdown**.\n\n- List items\n- Work like this\n\n### Sub section\n\nMore detail...`}
            className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 font-mono text-[13px] leading-relaxed text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
          />
          {showPreview && (
            <div
              className="prose min-h-[200px] rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5"
              dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-gray-400'>Preview will appear as you type</p>" }}
            />
          )}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--color-ink)] px-8 py-3.5 text-sm uppercase tracking-widest text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create post"}
        </button>
        {success && <span className="text-sm text-[var(--color-accent)]">Saved.</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
