import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/features/admin/components/image-manager";
import { adminFindProductById } from "@/features/admin/repositories/product-admin-repository";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProductImagesPage({ params }: { params: Params }) {
  const { id } = await params;
  const agg = await adminFindProductById(id);
  if (!agg) notFound();

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
          Images
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {agg.product.name} · Upload images directly to ImageKit. Attach to a specific variant or leave shared.
        </p>
      </div>
      <ImageManager
        productId={id}
        initialImages={agg.images}
        variants={agg.variants}
      />
    </div>
  );
}
