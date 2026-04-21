import Link from "next/link";
import { adminFindAllPosts } from "@/features/admin/repositories/blog-admin-repository";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await adminFindAllPosts();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Blog posts
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {posts.length} posts — shown as &ldquo;From the manufacturer&rdquo; sections on product pages.
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)]"
        >
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          No blog posts yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Author</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Published</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t border-[var(--color-line)]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{post.title}</p>
                    <p className="text-xs text-[var(--color-muted)]">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{post.authorName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                        post.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-[var(--color-bg-soft)] text-[var(--color-muted)]"
                      }`}
                    >
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${post.id}`}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
