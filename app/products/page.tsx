import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { ProductCard } from "@/features/products/components/product-card";
import { getAllProducts } from "@/features/products/services/product-service";
import { CATEGORY_LABEL, type ProductCategory } from "@/features/products/types";

export const revalidate = 60;

type SearchParams = Promise<{ category?: string }>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category } = await searchParams;
  const activeCategory = (
    category && category in CATEGORY_LABEL ? category : null
  ) as ProductCategory | null;

  const products = await getAllProducts();
  const filtered = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

  const categories = Object.entries(CATEGORY_LABEL) as [
    ProductCategory,
    string,
  ][];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <SiteNav />
        </div>
      </header>
      <main className="pt-32">
        <section className="mx-auto max-w-[1200px] px-6 pb-10 md:px-12">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Our Collection
          </p>
          <h1 className="font-serif text-[clamp(40px,6vw,72px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
            Every{" "}
            <em className="italic text-[var(--color-accent)]">piece</em>, built
            in our Wayanad workshop.
          </h1>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-10 md:px-12">
          <div className="flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-6">
            <Link
              href="/products"
              className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${
                !activeCategory
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                  : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
              }`}
            >
              All
            </Link>
            {categories.map(([value, label]) => (
              <Link
                key={value}
                href={`/products?category=${value}`}
                className={`rounded-full border px-4 py-2 text-[13px] transition-colors ${
                  activeCategory === value
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-30 md:px-12">
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-[var(--color-muted)]">
              No products match this filter yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
