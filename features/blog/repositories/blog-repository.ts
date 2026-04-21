import { desc, eq } from "drizzle-orm";
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
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row || !row.isPublished) return null;
  return row;
}

export async function findAll(): Promise<BlogPostRow[]> {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
}
