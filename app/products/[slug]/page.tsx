import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavWrapper } from "@/components/layout/nav-wrapper";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd } from "@/components/seo/json-ld";
import { EnquiryForm } from "@/features/enquiries/components/enquiry-form";
import { ProductGallery } from "@/features/products/components/product-gallery";
import { ProductSpecs } from "@/features/products/components/product-specs";
import {
  ProductBlogSections,
  ProductLongDescription,
} from "@/features/products/components/product-story";
import { getProductBySlug } from "@/features/products/services/product-service";
import { CATEGORY_LABEL } from "@/features/products/types";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found", robots: { index: false, follow: false } };
  }
  const ogPath = `/og/product/${product.slug}`;
  const url = `/products/${product.slug}`;
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description: product.description,
      url,
      type: "website",
      images: [{ url: ogPath, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [ogPath],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const jsonLd = [
    productJsonLd(product),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Products", path: "/products" },
      {
        name: CATEGORY_LABEL[product.category],
        path: `/products?category=${product.category}`,
      },
      { name: product.name, path: `/products/${product.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <NavWrapper />
        </div>
      </header>
      <main className="pt-32">
        <section className="mx-auto max-w-[1200px] px-6 pb-20 md:px-12">
          <Link
            href="/products"
            className="mb-10 inline-flex items-center gap-2 text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to collection
          </Link>

          <ProductGallery product={product} />
          <ProductLongDescription product={product} />
          <ProductSpecs product={product} />
          <ProductBlogSections sections={product.blogSections} />
        </section>

        <section id="enquiry" className="bg-[var(--color-bg-soft)] py-24">
          <div className="mx-auto max-w-[720px] px-6 md:px-12">
            <EnquiryForm
              defaultCategory={product.category}
              defaultProductSlug={product.slug}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
