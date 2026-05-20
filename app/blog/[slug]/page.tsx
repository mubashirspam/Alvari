import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedPostBySlug } from "@/features/blog/services/blog-service";
import { renderMarkdown } from "@/lib/markdown";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { title: "Post not found", robots: { index: false, follow: false } };
  }
  const ogPath = `/og/blog/${post.slug}`;
  const url = `/blog/${post.slug}`;
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName],
      tags: post.tags,
      images: [{ url: ogPath, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: [ogPath],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.contentMarkdown);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <SiteNav />
        </div>
      </header>
      <main className="pt-32">
        <article className="mx-auto max-w-[760px] px-6 pb-24 md:px-12">
          <Link
            href="/blog"
            className="mb-10 inline-flex items-center gap-2 text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to journal
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {post.category ? (
              <span className="text-[var(--color-accent)]">
                {post.category.replace(/-/g, " ")}
              </span>
            ) : null}
            {post.publishedAt ? (
              <>
                <span>·</span>
                <span>{DATE_FMT.format(post.publishedAt)}</span>
              </>
            ) : null}
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>

          <h1 className="mt-4 font-serif text-[clamp(36px,5.5vw,60px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-6 text-[18px] font-light italic leading-[1.65] text-[var(--color-muted)]">
              {post.excerpt}
            </p>
          ) : null}

          <div
            className="mt-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.tags.length > 0 ? (
            <div className="mt-14 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[12px] text-[var(--color-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
