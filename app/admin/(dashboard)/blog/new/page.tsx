import Link from "next/link";
import { BlogForm } from "@/features/admin/components/blog-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New post · Kaasth admin" };

export default function NewBlogPostPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/blog"
          className="mb-4 inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Back to blog
        </Link>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          New blog post
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Write in markdown. After saving, link this post to products from the product&apos;s Blog sections page.
        </p>
      </div>
      <BlogForm />
    </div>
  );
}
