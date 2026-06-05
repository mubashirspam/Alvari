import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";
import { getAllProducts } from "@/features/products/services/product-service";
import { getPublishedPosts } from "@/features/blog/services/blog-service";
import { CATEGORY_LABEL, type ProductCategory } from "@/features/products/types";

export const revalidate = 3600;

function url(path: string): string {
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/blog"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: url("/quotation"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryPages: MetadataRoute.Sitemap = (
    Object.keys(CATEGORY_LABEL) as ProductCategory[]
  ).map((cat) => ({
    url: url(`/products?category=${cat}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  let products: MetadataRoute.Sitemap = [];
  let posts: MetadataRoute.Sitemap = [];
  try {
    const [productList, postList] = await Promise.all([
      getAllProducts(),
      getPublishedPosts(),
    ]);
    products = productList
      .filter((p) => p.isActive)
      .map((p) => ({
        url: url(`/products/${p.slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: p.isFeatured ? 0.9 : 0.8,
      }));
    posts = postList.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: p.publishedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB unreachable at build — return static-only sitemap rather than fail the build
  }

  return [...staticPages, ...categoryPages, ...products, ...posts];
}
