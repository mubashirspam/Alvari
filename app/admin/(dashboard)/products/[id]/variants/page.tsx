import Link from "next/link";
import { notFound } from "next/navigation";
import { VariantManager } from "@/features/admin/components/variant-manager";
import { adminFindProductById } from "@/features/admin/repositories/product-admin-repository";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProductVariantsPage({ params }: { params: Params }) {
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
          Variants
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {agg.product.name} · {agg.variants.length} variants. Each variant can have its own pricing, stock, attributes, and images.
        </p>
      </div>
      <VariantManager productId={id} initialVariants={agg.variants} />
    </div>
  );
}
