import Link from "next/link";
import { notFound } from "next/navigation";
import { BreadcrumbLabel } from "@/features/admin/components/admin-breadcrumbs";
import { VariantManager } from "@/features/admin/components/variant-manager";
import { adminFindProductById } from "@/features/admin/repositories/product-admin-repository";
import { findAttributeDefsByCategory } from "@/features/variant-attributes/repositories/variant-attribute-repository";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function ProductVariantsPage({ params }: { params: Params }) {
  const { id } = await params;
  const agg = await adminFindProductById(id);
  if (!agg) notFound();
  const attributeDefs = await findAttributeDefsByCategory(agg.product.category);

  return (
    <div className="space-y-8">
      <BreadcrumbLabel segment={id} label={agg.product.name} />
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Variants
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {agg.product.name} · {agg.variants.length} variants. Each variant can have its own pricing, stock, attributes, and images.
        </p>
        {attributeDefs.length > 0 ? (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            This category asks for: {attributeDefs.map((d) => d.label).join(", ")} —{" "}
            <Link href="/admin/variant-attributes" className="underline hover:text-[var(--color-ink)]">
              edit definitions
            </Link>
          </p>
        ) : (
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            No attribute definitions for this category yet —{" "}
            <Link href="/admin/variant-attributes" className="underline hover:text-[var(--color-ink)]">
              define them
            </Link>{" "}
            to get structured pickers instead of free-form attributes.
          </p>
        )}
      </div>
      <VariantManager
        productId={id}
        productName={agg.product.name}
        initialVariants={agg.variants}
        attributeDefs={attributeDefs}
        basePriceNowInPaise={agg.product.priceNowInPaise}
        basePriceWasInPaise={agg.product.priceWasInPaise}
      />
    </div>
  );
}
