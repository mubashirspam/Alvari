"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteBlogButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this blog post? This action cannot be undone and will unlink it from all products.")) return;
    setDeleting(true);
    await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
    router.replace("/admin/blog");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-full border border-red-200 px-4 py-2 text-xs text-red-700 transition hover:border-red-400 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete post"}
    </button>
  );
}
