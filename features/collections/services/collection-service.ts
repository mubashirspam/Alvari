import * as repo from "@/features/collections/repositories/collection-repository";
import { mapCollection, type Collection, type CollectionWithProducts } from "@/features/collections/types";
import { getProductsByIds } from "@/features/products/services/product-service";
import { cached, invalidate } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import type { CollectionRow, NewCollectionRow } from "@/lib/db/schema";

export async function getFeaturedCollections(): Promise<Collection[]> {
  return cached(
    cacheKeys.collectionsFeatured,
    cacheTtl.collections,
    async () => {
      const rows = await repo.findFeatured();
      return rows.map(mapCollection);
    },
  );
}

export async function getActiveCollections(): Promise<Collection[]> {
  const rows = await repo.findActive();
  return rows.map(mapCollection);
}

export async function getAllCollections(): Promise<Collection[]> {
  const rows = await repo.findAll();
  return rows.map(mapCollection);
}

export async function getCollectionBySlug(
  slug: string,
): Promise<CollectionWithProducts | null> {
  return cached(cacheKeys.collectionBySlug(slug), cacheTtl.collections, async () => {
    const row = await repo.findBySlug(slug);
    if (!row) return null;
    const productMap = await repo.findProductIdsForCollections([row.id]);
    const items = productMap.get(row.id) ?? [];
    const products = await getProductsByIds(items.map((i) => i.productId));
    return { ...mapCollection(row), products };
  });
}

export async function getCollectionById(
  id: string,
): Promise<CollectionWithProducts | null> {
  const row = await repo.findById(id);
  if (!row) return null;
  const items = await repo.findCollectionProductsRaw(id);
  const products = await getProductsByIds(items.map((i) => i.productId));
  return { ...mapCollection(row), products };
}

export async function getFeaturedCollectionsWithProducts(): Promise<
  CollectionWithProducts[]
> {
  const featured = await getFeaturedCollections();
  if (featured.length === 0) return [];
  const productMap = await repo.findProductIdsForCollections(
    featured.map((c) => c.id),
  );
  const allIds = new Set<string>();
  for (const list of productMap.values()) {
    for (const it of list) allIds.add(it.productId);
  }
  const allProducts = await getProductsByIds([...allIds]);
  const byId = new Map(allProducts.map((p) => [p.id, p]));
  return featured.map((collection) => {
    const ids = (productMap.get(collection.id) ?? []).map((i) => i.productId);
    const products = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    return { ...collection, products };
  });
}

async function invalidateAll(slug?: string) {
  const keys: string[] = [cacheKeys.collectionsFeatured];
  if (slug) keys.push(cacheKeys.collectionBySlug(slug));
  await invalidate(...keys);
}

export async function createCollection(
  row: NewCollectionRow,
): Promise<Collection> {
  const inserted = await repo.insert(row);
  await invalidateAll(inserted.slug);
  return mapCollection(inserted);
}

export async function updateCollection(
  id: string,
  changes: Partial<NewCollectionRow>,
): Promise<Collection | null> {
  const updated = await repo.update(id, changes);
  await invalidateAll(updated?.slug);
  return updated ? mapCollection(updated) : null;
}

export async function deleteCollection(id: string): Promise<void> {
  await repo.remove(id);
  await invalidateAll();
}

export async function setCollectionProducts(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  const items = productIds.map((productId, sortOrder) => ({
    productId,
    sortOrder,
  }));
  await repo.replaceCollectionProducts(collectionId, items);
  const row = await repo.findById(collectionId);
  await invalidateAll(row?.slug);
}

export async function upsertCollectionBySlug(
  row: NewCollectionRow,
): Promise<CollectionRow> {
  const upserted = await repo.upsertBySlug(row);
  await invalidateAll(upserted.slug);
  return upserted;
}
