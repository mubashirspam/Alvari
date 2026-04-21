import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  blogPosts,
  type BlogPostRow,
  type NewBlogPostRow,
} from "@/lib/db/schema";

export async function adminFindAllPosts(): Promise<BlogPostRow[]> {
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
}

export async function adminFindPostById(
  id: string,
): Promise<BlogPostRow | null> {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function adminCreatePost(
  data: NewBlogPostRow,
): Promise<BlogPostRow> {
  const [row] = await db.insert(blogPosts).values(data).returning();
  return row;
}

export async function adminUpdatePost(
  id: string,
  data: Partial<NewBlogPostRow>,
): Promise<BlogPostRow | null> {
  const [row] = await db
    .update(blogPosts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();
  return row ?? null;
}

export async function adminDeletePost(id: string): Promise<void> {
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}
