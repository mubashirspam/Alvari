import * as repo from "@/features/banners/repositories/banner-repository";
import { isLive, mapBanner, type Banner, type BannerSlot } from "@/features/banners/types";
import { cached, invalidate } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import type { BannerRow, NewBannerRow } from "@/lib/db/schema";

const ALL_SLOTS: BannerSlot[] = [
  "hero",
  "secondary",
  "promo_strip",
  "mid_page",
  "collection_tile",
  "category_tile",
];

export async function getBannersBySlot(slot: BannerSlot): Promise<Banner[]> {
  return cached(cacheKeys.bannersBySlot(slot), cacheTtl.banners, async () => {
    const rows = await repo.findBySlot(slot);
    const mapped = rows.map(mapBanner);
    return mapped.filter((b) => isLive(b));
  });
}

export async function getAllBanners(): Promise<Banner[]> {
  const rows = await repo.findAll();
  return rows.map(mapBanner);
}

export async function getBannerById(id: string): Promise<Banner | null> {
  const row = await repo.findById(id);
  return row ? mapBanner(row) : null;
}

async function invalidateAll() {
  await invalidate(...ALL_SLOTS.map((s) => cacheKeys.bannersBySlot(s)));
}

export async function createBanner(row: NewBannerRow): Promise<Banner> {
  const inserted = await repo.insert(row);
  await invalidateAll();
  return mapBanner(inserted);
}

export async function updateBanner(
  id: string,
  changes: Partial<NewBannerRow>,
): Promise<Banner | null> {
  const updated = await repo.update(id, changes);
  await invalidateAll();
  return updated ? mapBanner(updated) : null;
}

export async function deleteBanner(id: string): Promise<void> {
  await repo.remove(id);
  await invalidateAll();
}

export async function upsertBannerBySlug(row: NewBannerRow): Promise<BannerRow> {
  const upserted = await repo.upsertBySlug(row);
  await invalidateAll();
  return upserted;
}
