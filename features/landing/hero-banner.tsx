import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBannersBySlot } from "@/features/banners/services/banner-service";
import { buildImageKitUrl } from "@/lib/imagekit";

export async function HeroBanner() {
  const banners = await getBannersBySlot("hero");
  if (banners.length === 0) return null;
  const banner = banners[0];

  const desktopSrc = buildImageKitUrl(banner.imageKey, {
    width: 2000,
    quality: 80,
    format: "auto",
  });
  const mobileSrc = banner.mobileImageKey
    ? buildImageKitUrl(banner.mobileImageKey, {
        width: 900,
        quality: 80,
        format: "auto",
      })
    : desktopSrc;

  return (
    <section className="relative bg-[var(--color-bg)] md:p-5">
      <div
        className="relative w-full overflow-hidden md:rounded-[24px]"
        style={{
          background: banner.bgColor ?? "#1a1a14",
          color: banner.textColor ?? "#fdf6e8",
        }}
      >
        <div className="relative h-[72vh] min-h-[460px] w-full md:h-[600px] lg:h-[680px]">
          <Image
            src={mobileSrc}
            alt={banner.title ?? "Hero"}
            fill
            priority
            sizes="(min-width: 768px) 0vw, 100vw"
            className="object-cover md:hidden"
          />
          <Image
            src={desktopSrc}
            alt={banner.title ?? "Hero"}
            fill
            priority
            sizes="(min-width: 768px) 100vw, 0vw"
            className="hidden object-cover md:block"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="relative z-10 flex h-full w-full flex-col justify-end px-6 pb-12 md:px-14 md:pb-16 lg:px-20 lg:pb-20">
            {banner.overline ? (
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] opacity-85 md:text-[12px]">
                {banner.overline}
              </p>
            ) : null}
            {banner.title ? (
              <h1 className="max-w-[640px] font-serif text-[clamp(40px,7vw,82px)] font-normal leading-[0.98] tracking-[-0.02em]">
                {banner.title}
              </h1>
            ) : null}
            {banner.subtitle ? (
              <p className="mt-5 max-w-[520px] text-[15px] leading-[1.65] opacity-90 md:text-[16px]">
                {banner.subtitle}
              </p>
            ) : null}
            {banner.ctaLabel && banner.ctaUrl ? (
              <div className="mt-8">
                <Link
                  href={banner.ctaUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-current/40 bg-white/10 px-7 py-3 text-[13px] font-medium uppercase tracking-[0.12em] backdrop-blur-sm transition hover:bg-white/20"
                >
                  {banner.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
