import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogLinker } from "@/features/admin/components/blog-linker";
import { adminFindAllPosts } from "@/features/admin/repositories/blog-admin-repository";
import {
  adminFindProductById,
  adminGetProductBlogLinks,
} from "@/features/admin/repositories/product-admin-repository";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProductBlogsPage({ params }: { params: Params }) {
  const { id } = await params;
  const [agg, allPosts, links] = await Promise.all([
    adminFindProductById(id),
    adminFindAllPosts(),
    adminGetProductBlogLinks(id),
  ]);

  if (!agg) notFound();

  const linkedIds = links.map((l) => l.blogPostId);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/products/${id}`}
          className="mb-4 inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Back to {agg.product.name}
        </Link>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Blog sections
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {agg.product.name} · Select blog posts to appear as &ldquo;From the manufacturer&rdquo; sections on the product page.
        </p>
      </div>
      <BlogLinker
        productId={id}
        allPosts={allPosts}
        linkedIds={linkedIds}
      />
    </div>
  );
}
