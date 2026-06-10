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
import { ReviewsSection } from "@/features/reviews/components/reviews-section";
import { getProductReviews } from "@/features/reviews/services/review-service";
import { CATEGORY_LABEL } from "@/features/products/types";
import { breadcrumbJsonLd, productJsonLd, faqJsonLd } from "@/lib/seo/jsonld";

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

  // Title pattern: "{Name} – {Material} {Category} | Alvari Kerala", trimmed to
  // ~60 chars. The "%s · Alvari" template in the root layout still applies, so
  // we keep the brand suffix concise here and let truncation guard length.
  const categoryLabel = CATEGORY_LABEL[product.category];
  const descriptor = [product.material, categoryLabel].filter(Boolean).join(" ");
  const fullTitle = `${product.name} – ${descriptor} | Alvari Kerala`;
  const title = fullTitle.length <= 60 ? fullTitle : `${product.name} – ${categoryLabel}`;

  // Description: lead with price + material, close with the factory-direct +
  // Kerala-delivery hook. Clamp to ~160 chars.
  const priceText = `from ₹${Math.round(product.priceNow).toLocaleString("en-IN")}`;
  const rawDescription = `${product.name} — ${priceText}${
    product.material ? `, ${product.material}` : ""
  }. Direct from our Wayanad factory, delivered across Kerala. ${product.description}`;
  const description =
    rawDescription.length <= 160 ? rawDescription : `${rawDescription.slice(0, 157).trimEnd()}…`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: ogPath, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const { summary: reviewSummary } = await getProductReviews(product.id);

  const inStock = product.variants.some((v) => v.stock > 0) || product.variants.length === 0;
  const deliveryWeeks = inStock ? "2–4" : "4–8";

  const productFaq = faqJsonLd([
    {
      question: `What is the price of ${product.name}?`,
      answer: `The ${product.name} starts at ₹${product.priceNow.toLocaleString("en-IN")}. ${product.variants.length > 1 ? `It is available in ${product.variants.length} variants.` : ""} Contact us on WhatsApp +91 9400306614 for the latest pricing.`,
    },
    {
      question: `How long does delivery of ${product.name} take in Kerala?`,
      answer: `Delivery takes ${deliveryWeeks} weeks after order confirmation and advance payment. Alvari delivers and installs across all districts of Kerala.`,
    },
    {
      question: `Can I customise the ${product.name} to my dimensions?`,
      answer: `Yes. Alvari accepts custom orders for any furniture including the ${product.name}. You can specify exact dimensions, wood type (teak, rubber wood, plywood), finish colour, and share reference images. Contact us on WhatsApp to discuss.`,
    },
    {
      question: `Does Alvari provide installation for ${product.name}?`,
      answer: `Yes, delivery and installation are included in the price across Kerala. Our team will install the furniture at your home.`,
    },
    {
      question: "What is Alvari's advance payment policy?",
      answer: "Alvari requires 50% advance to confirm production. The remaining balance is paid at the time of delivery and installation.",
    },
  ]);

  const jsonLd = [
    productJsonLd(product, reviewSummary),
    productFaq,
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
          <ReviewsSection productId={product.id} productSlug={product.slug} />
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
