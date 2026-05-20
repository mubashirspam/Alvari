import { getBannersBySlot } from "@/features/banners/services/banner-service";
import { HeroCarousel } from "./hero-carousel";

export async function HeroBanner() {
  const banners = await getBannersBySlot("hero");
  if (banners.length === 0) return null;
  return <HeroCarousel banners={banners} />;
}
