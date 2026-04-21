import { cached } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import {
  findPublished,
  findPublishedBySlug,
} from "@/blog/repositories/blog-repository";
import { mapBlogPost, type BlogPost } from "@/blog/types";

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return cached(cacheKeys.blogPublished, cacheTtl.blog, async () => {
    const rows = await findPublished();
    return rows.map(mapBlogPost);
  });
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  return cached(cacheKeys.blogBySlug(slug), cacheTtl.blog, async () => {
    const row = await findPublishedBySlug(slug);
    return row ? mapBlogPost(row) : null;
  });
}
