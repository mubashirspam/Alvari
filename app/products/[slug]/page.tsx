import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { EnquiryForm } from "@/features/enquiries/components/enquiry-form";
import { ProductGallery } from "@/features/products/components/product-gallery";
import { ProductSpecs } from "@/features/products/components/product-specs";
import {
  ProductBlogSections,
  ProductLongDescription,
} from "@/features/products/components/product-story";
import { getProductBySlug } from "@/features/products/services/product-service";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found · Alvari" };
  return {
    title: `${product.name} · Alvari`,
    description: product.description,
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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <SiteNav />
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
