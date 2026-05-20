"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Banner } from "@/features/banners/types";
import { buildImageKitUrl } from "@/lib/imagekit";

type Props = {
  banners: Banner[];
  intervalMs?: number;
};

export function HeroCarousel({ banners, intervalMs = 4500 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [banners.length, intervalMs]);

  if (banners.length === 0) return null;
  const active = banners[index];

  return (
    <section className="relative bg-[var(--color-bg)] md:p-5">
      <div
        className="relative w-full overflow-hidden md:rounded-[24px]"
        style={{
          background: active.bgColor ?? "#1a1a14",
          color: active.textColor ?? "#fdf6e8",
        }}
      >
        <div className="relative aspect-[16/9] w-full md:aspect-auto md:h-[600px] lg:h-[680px]">
          {banners.map((banner, i) => {
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
            const isActive = i === index;
            return (
              <div
                key={banner.id}
                className="absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]"
                style={{ opacity: isActive ? 1 : 0 }}
                aria-hidden={!isActive}
              >
                <Image
                  src={mobileSrc}
                  alt={banner.title ?? "Hero"}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 0vw, 100vw"
                  className="object-contain object-center md:hidden"
                />
                <Image
                  src={desktopSrc}
                  alt={banner.title ?? "Hero"}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 100vw, 0vw"
                  className="hidden object-cover md:block"
                />
              </div>
            );
          })}

          {(active.title || active.subtitle || active.ctaLabel) && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          )}

          <div className="relative z-10 flex h-full w-full flex-col justify-end px-6 pb-12 md:px-14 md:pb-16 lg:px-20 lg:pb-20">
            {active.overline ? (
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] opacity-85 md:text-[12px]">
                {active.overline}
              </p>
            ) : null}
            {active.title ? (
              <h1 className="max-w-[640px] font-serif text-[clamp(40px,7vw,82px)] font-normal leading-[0.98] tracking-[-0.02em]">
                {active.title}
              </h1>
            ) : null}
            {active.subtitle ? (
              <p className="mt-5 max-w-[520px] text-[15px] leading-[1.65] opacity-90 md:text-[16px]">
                {active.subtitle}
              </p>
            ) : null}
            {active.ctaLabel && active.ctaUrl ? (
              <div className="mt-8">
                <Link
                  href={active.ctaUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-current/40 bg-white/10 px-7 py-3 text-[13px] font-medium uppercase tracking-[0.12em] backdrop-blur-sm transition hover:bg-white/20"
                >
                  {active.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>

          {banners.length > 1 ? (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:bottom-7">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-current opacity-95" : "w-4 bg-current opacity-40"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
