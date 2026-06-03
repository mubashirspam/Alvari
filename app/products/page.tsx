import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavWrapper } from "@/components/layout/nav-wrapper";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd } from "@/components/seo/json-ld";
import { PromoStrip } from "@/features/landing/promo-strip";
import { CategoryBrowser } from "@/features/landing/category-browser";
import { ProductCard } from "@/features/products/components/product-card";
import { getAllProducts } from "@/features/products/services/product-service";
import { getVisibleTree } from "@/features/category-tree/services/category-tree-service";
import { CATEGORY_LABEL, type ProductCategory } from "@/features/products/types";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 60;

type SearchParams = Promise<{ category?: string; material?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { category, material } = await searchParams;
  const cat =
    category && category in CATEGORY_LABEL ? (category as ProductCategory) : null;
  const label = cat ? CATEGORY_LABEL[cat] : null;
  const title = label ? `${label} — Factory Prices, Kerala` : "All Furniture";
  const description = label
    ? `${label} built in our Wayanad workshop, delivered across Kerala. Factory prices, no middlemen.`
    : "Wardrobes, beds, sofas, dining sets, and complete room sets — built in Wayanad, delivered across Kerala at factory prices.";
  const params = new URLSearchParams();
  if (cat) params.set("category", cat);
  if (material) params.set("material", material);
  const qs = params.toString();
  return {
    title,
    description,
    alternates: { canonical: qs ? `/products?${qs}` : "/products" },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, material } = await searchParams;
  const activeCategory = (
    category && category in CATEGORY_LABEL ? category : null
  ) as ProductCategory | null;
  const activeMaterial = material?.trim().toLowerCase() || null;

  const [products, tree] = await Promise.all([
    getAllProducts(),
    getVisibleTree(),
  ]);
  const filtered = products.filter(
    (p) =>
      (!activeCategory || p.category === activeCategory) &&
      (!activeMaterial || p.material?.toLowerCase().includes(activeMaterial)),
  );

  const activeLabel = activeCategory ? CATEGORY_LABEL[activeCategory] : null;

  const categories = Object.entries(CATEGORY_LABEL) as [
    ProductCategory,
    string,
  ][];

  const crumbs = activeCategory
    ? [
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
        {
          name: CATEGORY_LABEL[activeCategory],
          path: `/products?category=${activeCategory}`,
        },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
      ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <header className="fixed inset-x-0 top-0 z-50">
        <PromoStrip />
        <HeaderWrapper>
          <NavWrapper variant="clubbed" />
        </HeaderWrapper>
      </header>
      <main className="pt-28">
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

        {tree.length > 0 ? (
          <CategoryBrowser
            tree={tree}
            overline="Browse by category"
            title={null}
            className="border-b border-[var(--color-line)] bg-[var(--color-bg)] pb-12"
          />
        ) : (
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
        )}

        <section className="mx-auto max-w-[1200px] px-6 pb-30 pt-10 md:px-12">
          {activeCategory || activeMaterial ? (
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-[var(--color-muted)]">
                Showing{" "}
                <span className="font-medium text-[var(--color-ink)]">
                  {activeLabel ?? "all"}
                </span>
                {activeMaterial ? (
                  <span className="text-[var(--color-ink)]"> · {activeMaterial}</span>
                ) : null}
                {" "}({filtered.length})
              </span>
              <Link
                href="/products"
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[12px] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
              >
                Clear ✕
              </Link>
            </div>
          ) : null}
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
