import { SiteFooter } from "@/components/layout/site-footer";
import { NavWrapper } from "@/components/layout/nav-wrapper";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { EnquiryCtaSection } from "@/features/landing/enquiry-cta-section";
import { FeaturedCollections } from "@/features/landing/featured-collections";
import { HeroBanner } from "@/features/landing/hero-banner";
import { MeasurementRequestForm } from "@/features/measurements/components/measurement-request-form";
import { MidPageBanner } from "@/features/landing/mid-page-banner";
import { ProcessSection } from "@/features/landing/process-section";
import { ProductRow } from "@/features/landing/product-row";
import { PromoStrip } from "@/features/landing/promo-strip";
import { ShopByCategory } from "@/features/landing/shop-by-category";
import { TrustStrip } from "@/features/landing/trust-strip";
import {
  getFeaturedProducts,
  getNewestProducts,
} from "@/features/products/services/product-service";

export const revalidate = 60;

export default async function HomePage() {
  const [newArrivals, bestSellers] = await Promise.all([
    getNewestProducts(12),
    getFeaturedProducts(12),
  ]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <PromoStrip />
        <HeaderWrapper>
          <NavWrapper variant="clubbed" />
        </HeaderWrapper>
      </header>
      <main className="pt-28">
        <HeroBanner />
        <TrustStrip />
        <ShopByCategory />
        <FeaturedCollections />
        <ProductRow
          overline="Just landed"
          title="New arrivals"
          viewAllHref="/products"
          products={newArrivals}
        />
        <MidPageBanner />
        <ProductRow
          overline="Customer favourites"
          title="Best sellers"
          viewAllHref="/products"
          products={bestSellers}
        />
        <ProcessSection />
        <section className="bg-[var(--color-bg)] py-20">
          <div className="mx-auto max-w-[720px] px-6 md:px-12">
            <MeasurementRequestForm />
          </div>
        </section>
        <EnquiryCtaSection />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
