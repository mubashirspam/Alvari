import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogForm } from "@/features/admin/components/blog-form";
import { adminFindPostById } from "@/features/admin/repositories/blog-admin-repository";
import { DeleteBlogButton } from "@/features/admin/components/delete-blog-button";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const post = await adminFindPostById(id);
  return { title: post ? `Edit: ${post.title} · Kaasth admin` : "Post not found" };
}

export default async function EditBlogPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const post = await adminFindPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/blog"
            className="mb-4 inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            ← Back to blog
          </Link>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            {post.title}
          </h1>
        </div>
        <DeleteBlogButton postId={post.id} />
      </div>
      <BlogForm post={post} />
    </div>
  );
}
