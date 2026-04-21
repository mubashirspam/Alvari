import { cached } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import {
  findAggregateBySlug,
  findAllAggregates,
  findFeaturedAggregates,
} from "@/features/products/repositories/product-repository";
import { mapProductAggregate, type Product } from "@/features/products/types";

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  return cached(
    cacheKeys.productsFeatured(limit),
    cacheTtl.products,
    async () => {
      const aggregates = await findFeaturedAggregates(limit);
      return aggregates.map(mapProductAggregate);
    },
  );
}

export async function getAllProducts(): Promise<Product[]> {
  return cached(cacheKeys.productsAll, cacheTtl.products, async () => {
    const aggregates = await findAllAggregates();
    return aggregates.map(mapProductAggregate);
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return cached(cacheKeys.productBySlug(slug), cacheTtl.products, async () => {
    const aggregate = await findAggregateBySlug(slug);
    return aggregate ? mapProductAggregate(aggregate) : null;
  });
}
