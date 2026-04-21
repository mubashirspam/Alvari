import Link from "next/link";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { ProductCard } from "@/features/products/components/product-card";
import { getFeaturedProducts } from "@/features/products/services/product-service";

export async function ProductsPreview() {
  const products = await getFeaturedProducts(6);

  return (
    <section id="products" className="bg-[var(--color-bg-soft)] py-30">
      <div className="mx-auto max-w-[1200px] px-6 md:px-12">
        <ScrollReveal className="mb-12 flex items-end justify-between gap-6">
          <h2 className="font-serif text-[clamp(36px,4vw,56px)] font-normal leading-none tracking-[-0.03em] text-[var(--color-ink)]">
            This month&apos;s{" "}
            <em className="italic text-[var(--color-accent)]">favourites.</em>
          </h2>
          <Link
            href="/products"
            className="shrink-0 border-b border-current pb-0.5 text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            See all products →
          </Link>
        </ScrollReveal>

        {products.length === 0 ? (
          <p className="text-center text-[var(--color-muted)]">
            Products coming soon — seed the database to populate this section.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, idx) => (
              <ScrollReveal
                key={product.id}
                delay={((idx % 3) + 1) as 1 | 2 | 3}
              >
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
