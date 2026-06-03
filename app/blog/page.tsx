import type { Metadata } from "next";
import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavWrapper } from "@/components/layout/nav-wrapper";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublishedPosts } from "@/features/blog/services/blog-service";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Journal — notes from a Wayanad furniture workshop",
  description:
    "Buying guides, care notes, materials and Kerala-specific advice from the Alvari workshop. Honest, practical, no fluff.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Alvari Journal",
    description:
      "Buying guides, care notes, and materials advice from our Wayanad workshop.",
    type: "website",
  },
};

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ])}
      />
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <NavWrapper />
        </div>
      </header>
      <main className="pt-32">
        <section className="mx-auto max-w-[1100px] px-6 pb-14 md:px-12">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Journal
          </p>
          <h1 className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
            Notes from our{" "}
            <em className="italic text-[var(--color-accent)]">workshop</em>.
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] font-light leading-[1.7] text-[var(--color-muted)]">
            Buying guides, care notes, and material trade-offs &mdash; written
            for Kerala homes, not for "lifestyle" magazines.
          </p>
        </section>

        <section className="mx-auto max-w-[1100px] px-6 pb-24 md:px-12">
          {posts.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-8 py-16 text-center">
              <p className="text-[15px] text-[var(--color-muted)]">
                The first posts are on their way. New articles publish every
                Tuesday and Friday.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {posts.map((post) => (
                <li key={post.id} className="py-7">
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
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
                    <h2 className="mt-3 font-serif text-[clamp(24px,3.2vw,34px)] leading-[1.15] tracking-[-0.02em] text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)]">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-3 max-w-3xl text-[15px] font-light leading-[1.7] text-[var(--color-muted)]">
                        {post.excerpt}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
