export const cacheKeys = {
  productsFeatured: (limit: number) => `products:featured:v1:${limit}`,
  productsAll: "products:all:v1",
  productBySlug: (slug: string) => `products:slug:v1:${slug}`,
} as const;

export const cacheTtl = {
  products: 60 * 10, // 10 minutes
} as const;
