import Link from "next/link";
import { CollectionForm } from "@/features/admin/components/collection-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New collection · Alvari admin" };

export default function NewCollectionPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/collections"
          className="mb-4 inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Back to collections
        </Link>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          New collection
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Create the collection first. After saving, you can attach products.
        </p>
      </div>
      <CollectionForm />
    </div>
  );
}
