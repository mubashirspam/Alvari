import { cached } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import {
  findAll,
  findBySlug,
  findFeatured,
} from "@/features/products/repositories/product-repository";
import { mapProductRow, type Product } from "@/features/products/types";

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  return cached(cacheKeys.productsFeatured(limit), cacheTtl.products, async () => {
    const rows = await findFeatured(limit);
    return rows.map(mapProductRow);
  });
}

export async function getAllProducts(): Promise<Product[]> {
  return cached(cacheKeys.productsAll, cacheTtl.products, async () => {
    const rows = await findAll();
    return rows.map(mapProductRow);
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return cached(cacheKeys.productBySlug(slug), cacheTtl.products, async () => {
    const row = await findBySlug(slug);
    return row ? mapProductRow(row) : null;
  });
}
