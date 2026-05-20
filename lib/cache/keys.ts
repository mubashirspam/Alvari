export const cacheKeys = {
  productsFeatured: (limit: number) => `products:featured:v2:${limit}`,
  productsAll: "products:all:v2",
  productBySlug: (slug: string) => `products:slug:v2:${slug}`,
  productsNewest: (limit: number) => `products:newest:v1:${limit}`,
  blogPublished: "blog:published:v1",
  blogBySlug: (slug: string) => `blog:slug:v1:${slug}`,
  categoriesVisible: "categories:visible:v1",
  bannersBySlot: (slot: string) => `banners:slot:v1:${slot}`,
  collectionsFeatured: "collections:featured:v1",
  collectionBySlug: (slug: string) => `collections:slug:v1:${slug}`,
} as const;

export const cacheTtl = {
  products: 60 * 10,
  blog: 60 * 10,
  categories: 60 * 30,
  banners: 60 * 5,
  collections: 60 * 10,
} as const;
