import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { MarqueeStrip } from "@/components/layout/marquee-strip";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { EnquiryCtaSection } from "@/features/landing/enquiry-cta-section";
import { HeroSection } from "@/features/landing/hero-section";
import { ProcessSection } from "@/features/landing/process-section";
import { ProductsPreview } from "@/features/landing/products-preview";
import { TestimonialSection } from "@/features/landing/testimonial-section";
import { WhySection } from "@/features/landing/why-section";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBar />
        <div className="flex justify-center px-3 pt-3 md:px-5 md:pt-4">
          <SiteNav />
        </div>
      </header>
      <main>
        <HeroSection />
        <MarqueeStrip />
        <WhySection />
        <ProductsPreview />
        <ProcessSection />
        <TestimonialSection />
        <EnquiryCtaSection />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
