"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ProductIllustration } from "@/features/products/components/product-illustration";
import type { Product, ProductImage, ProductVariant } from "@/features/products/types";
import { BADGE_LABEL, HOT_BADGES } from "@/features/products/types";
import { siteConfig } from "@/lib/env";
import { buildImageKitUrl } from "@/lib/imagekit";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
};

function imagesForVariant(
  all: ProductImage[],
  variantId: string | null,
): ProductImage[] {
  if (variantId) {
    const own = all.filter((img) => img.variantId === variantId);
    if (own.length > 0) {
      const shared = all.filter((img) => img.variantId === null);
      return [...own, ...shared];
    }
  }
  return all;
}

function formatAttrKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAttrValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function ProductGallery({ product }: Props) {
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0] ?? null;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null,
  );

  const selectedVariant: ProductVariant | null = useMemo(
    () =>
      product.variants.find((v) => v.id === selectedVariantId) ??
      defaultVariant,
    [selectedVariantId, defaultVariant, product.variants],
  );

  const gallery = useMemo(
    () => imagesForVariant(product.images, selectedVariant?.id ?? null),
    [product.images, selectedVariant],
  );

  const [activeIdx, setActiveIdx] = useState(0);
  const activeImage = gallery[activeIdx] ?? gallery[0] ?? null;

  const priceNow = selectedVariant?.priceNow ?? product.priceNow;
  const priceWas = selectedVariant?.priceWas ?? product.priceWas;
  const discount =
    selectedVariant?.discountPercent ?? product.discountPercent;
  const stock = selectedVariant?.stock ?? 0;

  const isHot = product.badge ? HOT_BADGES.has(product.badge) : false;

  const whatsappMsg = selectedVariant
    ? `Hi Alvari, I'm interested in the "${product.name}" (${selectedVariant.name} — SKU ${selectedVariant.sku})`
    : `Hi Alvari, I'm interested in the "${product.name}"`;

  function selectVariant(id: string) {
    setSelectedVariantId(id);
    setActiveIdx(0);
  }

  return (
    <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="space-y-4">
        <div
          className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[20px]"
          style={{
            background: `linear-gradient(145deg, ${product.gradientFrom}, ${product.gradientTo})`,
          }}
        >
          {product.badge && (
            <span
              className={cn(
                "absolute left-5 top-5 z-10 rounded-full px-3.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]",
                isHot
                  ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                  : "bg-[var(--color-bg)] text-[var(--color-ink)]",
              )}
            >
              {BADGE_LABEL[product.badge]}
            </span>
          )}

          {activeImage ? (
            <Image
              src={buildImageKitUrl(activeImage.imageKey, {
                width: 1200,
                quality: 80,
                format: "auto",
              })}
              alt={activeImage.alt ?? product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : product.imageUrl ? (
            <Image
              src={buildImageKitUrl(product.imageUrl, {
                width: 1200,
                quality: 80,
                format: "auto",
              })}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-[70%] w-[70%]">
              <ProductIllustration illustrationKey={product.illustrationKey} />
            </div>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="grid grid-cols-5 gap-3">
            {gallery.slice(0, 5).map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border transition",
                  idx === activeIdx
                    ? "border-[var(--color-accent)]"
                    : "border-[var(--color-line)] opacity-70 hover:opacity-100",
                )}
                aria-label={`View image ${idx + 1}`}
              >
                <Image
                  src={buildImageKitUrl(img.imageKey, {
                    width: 200,
                    quality: 70,
                    format: "auto",
                  })}
                  alt={img.alt ?? ""}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          {product.brand}
        </p>
        <h1 className="font-serif text-[clamp(32px,4vw,52px)] leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]">
          {product.name}
        </h1>
        <p className="mt-3 text-[15px] font-light text-[var(--color-muted)]">
          {product.meta}
        </p>

        <div className="mt-8 flex flex-wrap items-baseline gap-3">
          <span className="font-serif text-[36px] text-[var(--color-ink)]">
            {formatINR(priceNow)}
          </span>
          {priceWas > priceNow && (
            <>
              <span className="text-[15px] text-[var(--color-muted)] line-through">
                {formatINR(priceWas)}
              </span>
              <span className="rounded-full bg-[var(--color-ink)] px-3 py-1 text-[11px] tracking-wide text-[var(--color-bg)]">
                Save {discount}%
              </span>
            </>
          )}
        </div>

        <p
          className={cn(
            "mt-2 text-[12px] uppercase tracking-[0.14em]",
            stock > 0
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-muted)]",
          )}
        >
          {stock > 3
            ? "In stock · ready to dispatch"
            : stock > 0
              ? `Only ${stock} left · made-to-order after`
              : "Made to order · 4–8 week lead time"}
        </p>

        <p className="mt-8 text-base font-light leading-[1.8] text-[var(--color-muted)]">
          {product.description}
        </p>

        {product.variants.length > 1 && (
          <div className="mt-10">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Choose variant
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {product.variants.map((variant) => {
                const selected = variant.id === selectedVariant?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => selectVariant(variant.id)}
                    className={cn(
                      "flex flex-col items-start rounded-xl border px-4 py-3 text-left transition",
                      selected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                        : "border-[var(--color-line)] hover:border-[var(--color-ink)]",
                    )}
                  >
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {variant.name}
                    </span>
                    <span className="mt-1 text-xs text-[var(--color-muted)]">
                      {formatINR(variant.priceNow)} · SKU {variant.sku}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedVariant &&
          Object.keys(selectedVariant.attributes).length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5 text-[13px]">
              {Object.entries(selectedVariant.attributes).map(([key, val]) => (
                <div key={key} className="flex flex-col">
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {formatAttrKey(key)}
                  </dt>
                  <dd className="text-[var(--color-ink)]">
                    {formatAttrValue(val)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--color-ink)] px-9 py-4 text-sm tracking-wider text-[var(--color-bg)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-accent)]"
          >
            Enquire on WhatsApp
          </a>
          <a
            href="#enquiry"
            className="inline-flex items-center rounded-full border border-[var(--color-line)] px-9 py-4 text-sm tracking-wider text-[var(--color-ink)] transition-all duration-300 hover:border-[var(--color-accent)]"
          >
            Send enquiry form
          </a>
        </div>
      </div>
    </div>
  );
}
