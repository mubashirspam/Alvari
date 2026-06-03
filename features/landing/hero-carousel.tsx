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

const FALLBACK_OVERLINE = "ALVARI WORKSHOP · WAYANAD";
const FALLBACK_TITLE = "Crafted for\nKerala Homes";
const FALLBACK_SUBTITLE =
  "Premium solid-wood furniture built in our Wayanad workshop, delivered across Kerala.";

export function HeroCarousel({ banners, intervalMs = 5000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [banners.length, intervalMs]);

  if (banners.length === 0) return null;

  return (
    <section className="flex flex-col md:flex-row md:min-h-[580px] lg:min-h-[640px]">
      {/* Mobile image – shown above content on small screens */}
      <div className="relative aspect-[4/3] w-full overflow-hidden md:hidden">
        {banners.map((banner, i) => {
          const src = banner.mobileImageKey
            ? buildImageKitUrl(banner.mobileImageKey, { width: 900, quality: 80, format: "auto" })
            : buildImageKitUrl(banner.imageKey, { width: 900, quality: 80, format: "auto" });
          return (
            <div
              key={banner.id}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <Image
                src={src}
                alt={banner.title ?? "Hero"}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Left 1/3 – content panel */}
      <div className="relative flex flex-col justify-between bg-[var(--color-bg)] px-8 py-12 md:w-1/3 md:px-14 md:py-16">

        {/* Cross-fading banner content */}
        <div className="relative flex-1">
          <div className="grid grid-cols-1">
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                className="[grid-area:1/1] flex flex-col justify-center transition-opacity duration-700 ease-in-out"
                style={{
                  opacity: i === index ? 1 : 0,
                  pointerEvents: i === index ? "auto" : "none",
                }}
              >
                {/* Overline */}
                <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted)]">
                  {banner.overline ?? FALLBACK_OVERLINE}
                </p>

                {/* Title */}
                <h1 className="font-serif text-[clamp(34px,3.8vw,62px)] font-normal leading-[1.04] tracking-[-0.025em] text-[var(--color-ink)]">
                  {banner.title
                    ? banner.title
                    : FALLBACK_TITLE.split("\n").map((line, j) => (
                        <span key={j} className="block">
                          {line}
                        </span>
                      ))}
                </h1>

                {/* Subtitle */}
                <p className="mt-6 text-[13px] leading-[1.85] tracking-[0.01em] text-[var(--color-muted)]">
                  {banner.subtitle ?? FALLBACK_SUBTITLE}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — always visible, below the fading content */}
        <div className="mt-12 md:mt-14">
          {/* Thin rule */}
          <div className="mb-8 h-px w-12 bg-[var(--color-accent)]" />

          <Link
            href={banners[index]?.ctaUrl ?? "/products"}
            className="group inline-flex items-center gap-4 border border-[var(--color-ink)] px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-ink)] transition-all duration-300 hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]"
          >
            {banners[index]?.ctaLabel ?? "Explore Collection"}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>

      {/* Right 2/3 – image panel (desktop only) */}
      <div className="relative hidden overflow-hidden md:block md:w-2/3">
        {banners.map((banner, i) => {
          const src = buildImageKitUrl(banner.imageKey, {
            width: 2000,
            quality: 80,
            format: "auto",
          });
          return (
            <div
              key={banner.id}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <Image
                src={src}
                alt={banner.title ?? "Hero"}
                fill
                priority={i === 0}
                sizes="66vw"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
