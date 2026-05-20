import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  blogPosts,
  type BlogPostRow,
  type NewBlogPostRow,
} from "@/lib/db/schema";

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

export async function findUsedTopicSlugs(): Promise<Set<string>> {
  const rows = await db
    .select({ topicSlug: blogPosts.topicSlug })
    .from(blogPosts)
    .where(sql`${blogPosts.topicSlug} IS NOT NULL`);
  return new Set(
    rows.map((r) => r.topicSlug).filter((s): s is string => Boolean(s)),
  );
}

export async function existsBySlug(slug: string): Promise<boolean> {
  const rows = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return rows.length > 0;
}

export async function existingSlugs(slugs: string[]): Promise<Set<string>> {
  if (slugs.length === 0) return new Set();
  const rows = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(inArray(blogPosts.slug, slugs));
  return new Set(rows.map((r) => r.slug));
}

export async function insert(row: NewBlogPostRow): Promise<BlogPostRow> {
  const inserted = await db.insert(blogPosts).values(row).returning();
  if (!inserted[0]) throw new Error("Failed to insert blog post");
  return inserted[0];
}
