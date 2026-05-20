import type { BannerRow } from "@/lib/db/schema";

export type BannerSlot = BannerRow["slot"];

export type Banner = {
  id: string;
  slug: string;
  slot: BannerSlot;
  title: string | null;
  subtitle: string | null;
  overline: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageKey: string;
  mobileImageKey: string | null;
  bgColor: string | null;
  textColor: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
  isActive: boolean;
};

export const BANNER_SLOT_LABEL: Record<BannerSlot, string> = {
  hero: "Hero (top of homepage)",
  secondary: "Secondary (next to hero)",
  promo_strip: "Promo strip (thin colored bar)",
  mid_page: "Mid-page banner",
  collection_tile: "Collection tile",
  category_tile: "Category tile",
};

export function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    slug: row.slug,
    slot: row.slot,
    title: row.title,
    subtitle: row.subtitle,
    overline: row.overline,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    imageKey: row.imageKey,
    mobileImageKey: row.mobileImageKey,
    bgColor: row.bgColor,
    textColor: row.textColor,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export function isLive(banner: Banner, now = new Date()): boolean {
  if (!banner.isActive) return false;
  if (banner.startsAt && banner.startsAt > now) return false;
  if (banner.endsAt && banner.endsAt < now) return false;
  return true;
}
