import Link from "next/link";
import { getBannersBySlot } from "@/features/banners/services/banner-service";

export async function PromoStrip() {
  const banners = await getBannersBySlot("promo_strip");
  if (banners.length === 0) return null;
  const banner = banners[0];

  const content = (
    <span className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.04em] md:text-[13px]">
      {banner.title}
      {banner.ctaLabel ? (
        <span className="underline decoration-current/40 underline-offset-4">
          {banner.ctaLabel} →
        </span>
      ) : null}
    </span>
  );

  return (
    <div
      className="w-full text-center"
      style={{
        background: banner.bgColor ?? "var(--color-ink)",
        color: banner.textColor ?? "var(--color-bg)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-4 py-2 md:py-2.5">
        {banner.ctaUrl ? (
          <Link href={banner.ctaUrl} className="hover:opacity-90">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
