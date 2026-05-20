import { CategoryNav } from "@/components/layout/category-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { EnquiryCtaSection } from "@/features/landing/enquiry-cta-section";
import { FeaturedCollections } from "@/features/landing/featured-collections";
import { HeroBanner } from "@/features/landing/hero-banner";
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
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <HeaderWrapper>
            <SiteNav variant="clubbed" />
            <CategoryNav variant="clubbed" />
          </HeaderWrapper>
        </div>
      </header>
      <main className="pt-36 md:pt-40">
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
        <EnquiryCtaSection />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
