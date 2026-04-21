export const cacheKeys = {
  productsFeatured: (limit: number) => `products:featured:v2:${limit}`,
  productsAll: "products:all:v2",
  productBySlug: (slug: string) => `products:slug:v2:${slug}`,
  blogPublished: "blog:published:v1",
  blogBySlug: (slug: string) => `blog:slug:v1:${slug}`,
} as const;

export const cacheTtl = {
  products: 60 * 10,
  blog: 60 * 10,
} as const;
