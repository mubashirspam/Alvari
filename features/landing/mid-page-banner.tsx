import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBannersBySlot } from "@/features/banners/services/banner-service";
import { buildImageKitUrl } from "@/lib/imagekit";

export async function MidPageBanner() {
  const banners = await getBannersBySlot("mid_page");
  if (banners.length === 0) return null;
  const banner = banners[0];
  const img = buildImageKitUrl(banner.imageKey, {
    width: 2000,
    quality: 80,
    format: "auto",
  });

  return (
    <section className="bg-[var(--color-bg)] py-10 md:py-16">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div
          className="relative overflow-hidden rounded-[20px] text-white"
          style={{ background: banner.bgColor ?? "#3a2916" }}
        >
          <div className="relative h-[300px] md:h-[360px] lg:h-[420px]">
            <Image
              src={img}
              alt={banner.title ?? "Banner"}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
            <div className="relative z-10 flex h-full max-w-[640px] flex-col justify-center p-8 md:p-14 lg:p-20">
              {banner.overline ? (
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] opacity-85">
                  {banner.overline}
                </p>
              ) : null}
              {banner.title ? (
                <h2 className="font-serif text-[clamp(28px,4.5vw,52px)] leading-[1.05] tracking-[-0.02em]">
                  {banner.title}
                </h2>
              ) : null}
              {banner.subtitle ? (
                <p className="mt-4 text-[15px] leading-[1.65] opacity-90">
                  {banner.subtitle}
                </p>
              ) : null}
              {banner.ctaLabel && banner.ctaUrl ? (
                <div className="mt-7">
                  <Link
                    href={banner.ctaUrl}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[13px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink)] transition hover:bg-white/90"
                  >
                    {banner.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
