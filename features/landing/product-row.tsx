import Link from "next/link";
import { ProductCard } from "@/features/products/components/product-card";
import type { Product } from "@/features/products/types";

type Props = {
  overline?: string;
  title: string;
  viewAllHref?: string;
  products: Product[];
};

export function ProductRow({ overline, title, viewAllHref, products }: Props) {
  if (products.length === 0) return null;

  return (
    <section className="bg-[var(--color-bg)] py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="mb-6 flex items-end justify-between md:mb-10">
          <div>
            {overline ? (
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-accent)]">
                {overline}
              </p>
            ) : null}
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
              {title}
            </h2>
          </div>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-[13px] text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
            >
              View all →
            </Link>
          ) : null}
        </div>

        <div className="-mx-6 overflow-x-auto px-6 pb-2 md:-mx-12 md:px-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-5 md:gap-7">
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[78vw] flex-shrink-0 sm:w-[55vw] md:w-[320px] lg:w-[340px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
