import * as repo from "@/features/blog/repositories/blog-repository";
import { mapBlogPost, type BlogPost } from "@/features/blog/types";
import { cached, invalidate } from "@/lib/cache/redis";
import { cacheKeys, cacheTtl } from "@/lib/cache/keys";
import { generateBlogPost } from "@/lib/content/blog-generator";
import { TOPICS, type ContentTopic } from "@/lib/content/topics";
import { submitToIndexNow } from "@/lib/seo/indexnow";

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return cached(cacheKeys.blogPublished, cacheTtl.blog, async () => {
    const rows = await repo.findPublished();
    return rows.map(mapBlogPost);
  });
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  return cached(cacheKeys.blogBySlug(slug), cacheTtl.blog, async () => {
    const row = await repo.findPublishedBySlug(slug);
    return row ? mapBlogPost(row) : null;
  });
}

async function pickNextTopic(): Promise<ContentTopic | null> {
  const used = await repo.findUsedTopicSlugs();
  const candidates = TOPICS.filter((t) => !used.has(t.topicSlug)).sort(
    (a, b) => b.priority - a.priority,
  );
  return candidates[0] ?? null;
}

async function uniqueSlug(base: string): Promise<string> {
  const candidates = [base];
  for (let i = 2; i <= 10; i++) candidates.push(`${base}-${i}`);
  const taken = await repo.existingSlugs(candidates);
  return candidates.find((s) => !taken.has(s)) ?? `${base}-${Date.now()}`;
}

export type GenerationOutcome =
  | { status: "generated"; post: BlogPost; topicSlug: string }
  | { status: "no_topics_left" };

export async function generateNextPost(): Promise<GenerationOutcome> {
  const topic = await pickNextTopic();
  if (!topic) return { status: "no_topics_left" };

  const result = await generateBlogPost(topic);
  const slug = await uniqueSlug(result.post.slug);

  const inserted = await repo.insert({
    slug,
    title: result.post.title,
    excerpt: result.post.excerpt,
    contentMarkdown: result.post.contentMarkdown,
    readingMinutes: result.post.readingMinutes,
    metaTitle: result.post.metaTitle,
    metaDescription: result.post.metaDescription,
    tags: result.post.tags,
    language: "en",
    category: topic.category,
    topicSlug: topic.topicSlug,
    generationModel: result.usage.model,
    generationInputTokens: result.usage.inputTokens,
    generationOutputTokens: result.usage.outputTokens,
    authorName: "Alvari",
    isPublished: true,
    publishedAt: new Date(),
  });

  await invalidate(cacheKeys.blogPublished, cacheKeys.blogBySlug(slug));
  submitToIndexNow([`/blog/${slug}`, "/blog"]);

  return {
    status: "generated",
    post: mapBlogPost(inserted),
    topicSlug: topic.topicSlug,
  };
}
