"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createBanner,
  deleteBanner,
  updateBanner,
} from "@/features/banners/services/banner-service";
import { requireAdmin } from "@/lib/auth/session";
import type { BannerSlot } from "@/features/banners/types";

const SLOTS: BannerSlot[] = [
  "hero",
  "secondary",
  "promo_strip",
  "mid_page",
  "collection_tile",
  "category_tile",
];

const Schema = z.object({
  slug: z.string().min(1).max(120),
  slot: z.enum(SLOTS as [BannerSlot, ...BannerSlot[]]),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  overline: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaUrl: z.string().optional().nullable(),
  imageKey: z.string().min(1, "Image URL required"),
  mobileImageKey: z.string().optional().nullable(),
  bgColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseForm(fd: FormData) {
  const parsed = Schema.parse({
    slug: fd.get("slug"),
    slot: fd.get("slot"),
    title: emptyToNull(fd.get("title")),
    subtitle: emptyToNull(fd.get("subtitle")),
    overline: emptyToNull(fd.get("overline")),
    ctaLabel: emptyToNull(fd.get("ctaLabel")),
    ctaUrl: emptyToNull(fd.get("ctaUrl")),
    imageKey: fd.get("imageKey"),
    mobileImageKey: emptyToNull(fd.get("mobileImageKey")),
    bgColor: emptyToNull(fd.get("bgColor")),
    textColor: emptyToNull(fd.get("textColor")),
    startsAt: emptyToNull(fd.get("startsAt")),
    endsAt: emptyToNull(fd.get("endsAt")),
    sortOrder: fd.get("sortOrder") ?? 0,
    isActive: fd.get("isActive") === "on",
  });
  return {
    ...parsed,
    startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
    endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
  };
}

export async function createBannerAction(fd: FormData) {
  await requireAdmin();
  const data = parseForm(fd);
  await createBanner(data);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function updateBannerAction(id: string, fd: FormData) {
  await requireAdmin();
  const data = parseForm(fd);
  await updateBanner(id, data);
  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function deleteBannerAction(id: string) {
  await requireAdmin();
  await deleteBanner(id);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
