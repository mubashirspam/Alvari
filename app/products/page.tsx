import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavWrapper } from "@/components/layout/nav-wrapper";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd } from "@/components/seo/json-ld";
import { PromoStrip } from "@/features/landing/promo-strip";
import { ProductsClientShell } from "@/features/products/components/products-client-shell";
import { getAllProducts } from "@/features/products/services/product-service";
import { CATEGORY_LABEL, type ProductCategory } from "@/features/products/types";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 60;

type SearchParams = Promise<{ category?: string; q?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const cat =
    category && category in CATEGORY_LABEL ? (category as ProductCategory) : null;
  const label = cat ? CATEGORY_LABEL[cat] : null;
  const title = label ? `${label} — Factory Prices, Kerala` : "All Furniture";
  const description = label
    ? `${label} built in our Wayanad workshop, delivered across Kerala. Factory prices, no middlemen.`
    : "Wardrobes, beds, sofas, dining sets and more — built in Wayanad, delivered across Kerala at factory prices.";
  const qs = cat ? `?category=${cat}` : "";
  return {
    title,
    description,
    alternates: { canonical: `/products${qs}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, q } = await searchParams;
  const initialCategory = (
    category && category in CATEGORY_LABEL ? category : null
  ) as ProductCategory | null;

  const [products, crumbs] = await Promise.all([
    getAllProducts(),
    Promise.resolve(
      initialCategory
        ? [
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: CATEGORY_LABEL[initialCategory], path: `/products?category=${initialCategory}` },
          ]
        : [
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
          ],
    ),
  ]);

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
        {/* Page heading */}
        <div className="mx-auto max-w-[1200px] px-4 pb-6 pt-6 md:px-12">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Our Collection
          </p>
          <h1 className="font-serif text-[clamp(32px,5vw,60px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
            Find your{" "}
            <em className="italic text-[var(--color-accent)]">perfect</em> piece.
          </h1>
        </div>

        {/* Client shell — search, filter, grid */}
        <ProductsClientShell
          products={products}
          initialCategory={initialCategory}
          initialQuery={q ?? null}
        />
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
