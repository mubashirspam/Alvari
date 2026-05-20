"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Collection } from "@/features/collections/types";
import {
  createCollectionAction,
  deleteCollectionAction,
  updateCollectionAction,
} from "@/app/admin/(dashboard)/collections/actions";

type Props = {
  collection?: Collection;
};

export function CollectionForm({ collection }: Props) {
  const isEdit = Boolean(collection);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(collection?.heroImageKey ?? "");

  function handleSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && collection) {
          await updateCollectionAction(collection.id, fd);
        } else {
          await createCollectionAction(fd);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function handleDelete() {
    if (!collection) return;
    if (!confirm(`Delete collection "${collection.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCollectionAction(collection.id);
        window.location.href = "/admin/collections";
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required defaultValue={collection?.title ?? ""} />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            required
            defaultValue={collection?.slug ?? ""}
            placeholder="dawn"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="subtitle">Subtitle (small label above title)</Label>
        <Input
          id="subtitle"
          name="subtitle"
          defaultValue={collection?.subtitle ?? ""}
          placeholder="The new collection"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (shown on collection page)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={collection?.description ?? ""}
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
        />
      </div>

      <div>
        <Label htmlFor="heroImageKey">Hero image URL</Label>
        <Input
          id="heroImageKey"
          name="heroImageKey"
          defaultValue={collection?.heroImageKey ?? ""}
          onChange={(e) => setPreview(e.target.value)}
          placeholder="https://images.unsplash.com/photo-..."
        />
        {preview ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-line)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="block max-h-[220px] w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="accentColor">Accent color (hex)</Label>
          <Input
            id="accentColor"
            name="accentColor"
            defaultValue={collection?.accentColor ?? ""}
            placeholder="#c8956d"
          />
        </div>
        <div>
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={collection?.sortOrder ?? 0}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={collection?.isFeatured ?? false}
            className="h-4 w-4"
          />
          <span className="text-sm">Featured on homepage</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={collection?.isActive ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-ink)] px-7 py-3 text-sm text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create collection"}
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            Delete collection
          </button>
        ) : null}
      </div>
    </form>
  );
}
