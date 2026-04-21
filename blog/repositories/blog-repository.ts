import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, type BlogPostRow } from "@/lib/db/schema";

export async function findPublished(): Promise<BlogPostRow[]> {
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function findPublishedBySlug(
  slug: string,
): Promise<BlogPostRow | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findAll(): Promise<BlogPostRow[]> {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
}
