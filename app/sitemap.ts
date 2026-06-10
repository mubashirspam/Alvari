import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";
import { buildImageKitUrl } from "@/lib/imagekit";
import { getAllProducts } from "@/features/products/services/product-service";
import { getPublishedPosts } from "@/features/blog/services/blog-service";
import {
  CATEGORY_LABEL,
  type Product,
  type ProductCategory,
} from "@/features/products/types";

// Google Images is a major furniture-discovery channel, so we surface up to
// five product images per URL in the sitemap (the <image:image> extension).
function productImageUrls(p: Product): string[] {
  const keys = p.images.map((img) => img.imageKey);
  const fallback = p.imageUrl ?? p.illustrationKey;
  if (keys.length === 0 && fallback) keys.push(fallback);
  return keys
    .slice(0, 5)
    .map((key) => buildImageKitUrl(key, { width: 1200, format: "auto" }));
}

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
      .map((p) => {
        const images = productImageUrls(p);
        return {
          url: url(`/products/${p.slug}`),
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: p.isFeatured ? 0.9 : 0.8,
          ...(images.length > 0 ? { images } : {}),
        };
      });
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
