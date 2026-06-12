"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Share2, Check } from "lucide-react";
import { ProductIllustration } from "@/features/products/components/product-illustration";
import type { Product, ProductImage, ProductVariant } from "@/features/products/types";
import { BADGE_LABEL, HOT_BADGES } from "@/features/products/types";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import type { VariantAttributeDef } from "@/features/variant-attributes/types";
import { siteConfig } from "@/lib/env";
import { buildImageKitUrl } from "@/lib/imagekit";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  attributeDefs?: VariantAttributeDef[];
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

/**
 * Attribute-based variant picker: one chip/swatch group per category-defined
 * attribute (doors, size, colour…). An option is dimmed when no variant
 * matches it together with the other currently selected attributes — clicking
 * it still works and jumps to the closest matching variant.
 */
function AttributePickers({
  defs,
  variants,
  selectedVariant,
  onSelect,
}: {
  defs: VariantAttributeDef[];
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (id: string) => void;
}) {
  const attrValue = (v: ProductVariant, key: string) =>
    v.attributes[key] === undefined ? null : String(v.attributes[key]);

  return (
    <div className="mt-10 space-y-6">
      {defs.map((def) => {
        // Options from the definition first, then any extra values that
        // exist on variants but were removed from the definition.
        const valuesInVariants = [
          ...new Set(
            variants
              .map((v) => attrValue(v, def.key))
              .filter((v): v is string => v !== null),
          ),
        ];
        const options = [
          ...def.options.filter((o) => valuesInVariants.includes(o)),
          ...valuesInVariants.filter((v) => !def.options.includes(v)),
        ];
        if (options.length === 0) return null;

        const selectedValue = selectedVariant
          ? attrValue(selectedVariant, def.key)
          : null;

        return (
          <div key={def.key}>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {def.label}
              {selectedValue && (
                <span className="ml-2 normal-case tracking-normal text-[var(--color-ink)]">
                  {selectedValue}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const selected = selectedValue === option;
                // Compatible: a variant exists with this option AND the other
                // currently selected attribute values.
                const compatible = variants.some(
                  (v) =>
                    attrValue(v, def.key) === option &&
                    defs.every(
                      (d) =>
                        d.key === def.key ||
                        !selectedVariant ||
                        attrValue(selectedVariant, d.key) === null ||
                        attrValue(v, d.key) === attrValue(selectedVariant, d.key),
                    ),
                );

                function handleClick() {
                  // Prefer the variant matching current selection + this option,
                  // else jump to the first variant carrying this option.
                  const exact = variants.find(
                    (v) =>
                      attrValue(v, def.key) === option &&
                      defs.every(
                        (d) =>
                          d.key === def.key ||
                          !selectedVariant ||
                          attrValue(selectedVariant, d.key) === null ||
                          attrValue(v, d.key) === attrValue(selectedVariant, d.key),
                      ),
                  );
                  const target =
                    exact ?? variants.find((v) => attrValue(v, def.key) === option);
                  if (target) onSelect(target.id);
                }

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={handleClick}
                    aria-pressed={selected}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition",
                      selected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-ink)]"
                        : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-ink)]",
                      !compatible && !selected && "opacity-40",
                    )}
                  >
                    {def.inputType === "color" && (
                      <span
                        aria-hidden
                        className="h-3.5 w-3.5 rounded-full border border-[var(--color-line)]"
                        style={{ background: option.toLowerCase() }}
                      />
                    )}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductGallery({ product, attributeDefs = [] }: Props) {
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
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${siteConfig.url}/products/${product.slug}`;
    const shareData = {
      title: product.name,
      text: `${product.name} — ${product.meta}`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share(shareData); return; } catch { /* cancelled */ }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  const priceNow = selectedVariant?.priceNow ?? product.priceNow;
  const priceWas = selectedVariant?.priceWas ?? product.priceWas;
  const discount =
    selectedVariant?.discountPercent ?? product.discountPercent;
  const stock = selectedVariant?.stock ?? 0;

  const isHot = product.badge ? HOT_BADGES.has(product.badge) : false;

  // Attribute pickers need defs whose keys actually occur on the variants.
  const usableDefs = attributeDefs.filter((def) =>
    product.variants.some((v) => v.attributes[def.key] !== undefined),
  );

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

        {product.priceIsIndicative && (
          <p className="mt-2 text-[13px] text-[var(--color-muted)]">
            Indicative price — final price &amp; delivery confirmed by our team.
          </p>
        )}

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

        {usableDefs.length > 0 && product.variants.length > 1 ? (
          <AttributePickers
            defs={usableDefs}
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelect={selectVariant}
          />
        ) : (
          product.variants.length > 1 && (
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
          )
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

        <div className="mt-10 flex flex-wrap gap-3">
          <AddToCartButton
            product={product}
            variant={selectedVariant}
            imageUrl={product.imageUrl}
            shape="full"
            label="Add to cart"
          />
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-5 py-3.5 text-[13px] font-medium text-[var(--color-ink)] transition-all duration-300 hover:border-[var(--color-accent)]"
            aria-label="Share product"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
