import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/features/admin/components/product-form";
import { adminFindProductById } from "@/features/admin/repositories/product-admin-repository";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const agg = await adminFindProductById(id);
  return { title: agg ? `Edit ${agg.product.name} · Kaasth admin` : "Product not found" };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const agg = await adminFindProductById(id);
  if (!agg) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/products"
          className="mb-4 inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Back to products
        </Link>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          {agg.product.name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { href: `/admin/products/${id}/variants`, label: "Variants" },
              { href: `/admin/products/${id}/images`, label: "Images" },
              { href: `/admin/products/${id}/blogs`, label: "Blog sections" },
              { href: `/products/${agg.product.slug}`, label: "View on site →" },
            ] as const
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <ProductForm product={agg.product} />
    </div>
  );
}
