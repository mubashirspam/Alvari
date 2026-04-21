import type { Product } from "@/features/products/types";
import { CATEGORY_LABEL } from "@/features/products/types";

type SpecRow = { label: string; value: string };

export function ProductSpecs({ product }: { product: Product }) {
  const rows: SpecRow[] = [
    { label: "Category", value: CATEGORY_LABEL[product.category] },
    { label: "Brand", value: product.brand },
  ];
  if (product.material) rows.push({ label: "Material", value: product.material });
  if (product.dimensions)
    rows.push({ label: "Dimensions", value: product.dimensions });
  if (product.weightKg !== null)
    rows.push({ label: "Weight", value: `${product.weightKg} kg` });
  rows.push({
    label: "Warranty",
    value:
      product.warrantyMonths >= 24
        ? `${Math.round(product.warrantyMonths / 12)} years`
        : `${product.warrantyMonths} months`,
  });
  if (product.careInstructions)
    rows.push({ label: "Care", value: product.careInstructions });

  return (
    <section className="mt-20 border-t border-[var(--color-line)] pt-16">
      <h2 className="mb-8 font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
        Specifications
      </h2>
      <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col border-b border-dashed border-[var(--color-line)] pb-4"
          >
            <dt className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {row.label}
            </dt>
            <dd className="mt-1 text-[15px] font-light leading-relaxed text-[var(--color-ink)]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
