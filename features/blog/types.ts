import type { BlogPostRow } from "@/lib/db/schema";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageKey: string | null;
  contentMarkdown: string;
  authorName: string;
  readingMinutes: number;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  language: string;
  category: string | null;
  topicSlug: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
};

export function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageKey: row.coverImageKey,
    contentMarkdown: row.contentMarkdown,
    authorName: row.authorName,
    readingMinutes: row.readingMinutes,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    tags: row.tags ?? [],
    language: row.language,
    category: row.category,
    topicSlug: row.topicSlug,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt,
  };
}
