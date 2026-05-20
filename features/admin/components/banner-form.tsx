"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BANNER_SLOT_LABEL, type Banner, type BannerSlot } from "@/features/banners/types";
import {
  createBannerAction,
  deleteBannerAction,
  updateBannerAction,
} from "@/app/admin/(dashboard)/banners/actions";

type Props = {
  banner?: Banner;
};

const SLOTS: BannerSlot[] = [
  "hero",
  "secondary",
  "promo_strip",
  "mid_page",
  "collection_tile",
  "category_tile",
];

function toLocalDatetime(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BannerForm({ banner }: Props) {
  const isEdit = Boolean(banner);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState(banner?.imageKey ?? "");

  function handleSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && banner) {
          await updateBannerAction(banner.id, fd);
        } else {
          await createBannerAction(fd);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function handleDelete() {
    if (!banner) return;
    if (!confirm(`Delete banner "${banner.slug}"?`)) return;
    startTransition(async () => {
      try {
        await deleteBannerAction(banner.id);
        window.location.href = "/admin/banners";
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            required
            defaultValue={banner?.slug ?? ""}
            placeholder="hero-spring-sale"
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Unique identifier. Lowercase, kebab-case.
          </p>
        </div>
        <div>
          <Label htmlFor="slot">Slot</Label>
          <select
            id="slot"
            name="slot"
            defaultValue={banner?.slot ?? "hero"}
            className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {BANNER_SLOT_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <Label htmlFor="overline">Overline (small label)</Label>
          <Input id="overline" name="overline" defaultValue={banner?.overline ?? ""} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={banner?.title ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="subtitle">Subtitle</Label>
        <textarea
          id="subtitle"
          name="subtitle"
          rows={2}
          defaultValue={banner?.subtitle ?? ""}
          className="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="ctaLabel">CTA label</Label>
          <Input id="ctaLabel" name="ctaLabel" defaultValue={banner?.ctaLabel ?? ""} placeholder="Shop now" />
        </div>
        <div>
          <Label htmlFor="ctaUrl">CTA URL</Label>
          <Input id="ctaUrl" name="ctaUrl" defaultValue={banner?.ctaUrl ?? ""} placeholder="/products" />
        </div>
      </div>

      <div>
        <Label htmlFor="imageKey">Image URL (desktop)</Label>
        <Input
          id="imageKey"
          name="imageKey"
          required
          defaultValue={banner?.imageKey ?? ""}
          onChange={(e) => setImagePreview(e.target.value)}
          placeholder="https://images.unsplash.com/photo-... or ImageKit path"
        />
        {imagePreview ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-[var(--color-line)]">
            <img
              src={imagePreview}
              alt=""
              className="block max-h-[200px] w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="mobileImageKey">Image URL (mobile, optional)</Label>
        <Input
          id="mobileImageKey"
          name="mobileImageKey"
          defaultValue={banner?.mobileImageKey ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <Label htmlFor="bgColor">Background color (hex)</Label>
          <Input id="bgColor" name="bgColor" defaultValue={banner?.bgColor ?? ""} placeholder="#2b1d0c" />
        </div>
        <div>
          <Label htmlFor="textColor">Text color (hex)</Label>
          <Input id="textColor" name="textColor" defaultValue={banner?.textColor ?? ""} placeholder="#fdf6e8" />
        </div>
        <div>
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={banner?.sortOrder ?? 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="startsAt">Starts at (optional)</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalDatetime(banner?.startsAt ?? null)}
          />
        </div>
        <div>
          <Label htmlFor="endsAt">Ends at (optional)</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={toLocalDatetime(banner?.endsAt ?? null)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={banner?.isActive ?? true}
          className="h-4 w-4"
        />
        <span className="text-sm">Active (visible on site)</span>
      </label>

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-ink)] px-7 py-3 text-sm text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create banner"}
        </button>
        {isEdit ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            Delete banner
          </button>
        ) : null}
      </div>
    </form>
  );
}
