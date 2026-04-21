import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { buildImageKitUrl } from "@/lib/imagekit";
import {
  BADGE_LABEL,
  HOT_BADGES,
  type Product,
} from "@/features/products/types";
import { ProductIllustration } from "./product-illustration";

export function ProductCard({ product }: { product: Product }) {
  const isHot = product.badge ? HOT_BADGES.has(product.badge) : false;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-md bg-[var(--color-bg)] transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] hover:-translate-y-2 hover:shadow-[0_24px_60px_rgb(42_26_16_/_0.1)]"
    >
      <div
        className="relative flex aspect-[4/5] items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${product.gradientFrom}, ${product.gradientTo})`,
        }}
      >
        {product.badge && (
          <span
            className={`absolute left-4 top-4 rounded-full px-3.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
              isHot
                ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                : "bg-[var(--color-bg)] text-[var(--color-ink)]"
            }`}
          >
            {BADGE_LABEL[product.badge]}
          </span>
        )}

        {product.imageUrl ? (
          <Image
            src={buildImageKitUrl(product.imageUrl, {
              width: 600,
              quality: 75,
              format: "auto",
            })}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-[1.08]"
          />
        ) : (
          <div className="h-[70%] w-[70%] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-[1.08]">
            <ProductIllustration illustrationKey={product.illustrationKey} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-ink)] opacity-0 transition-opacity duration-400 group-hover:opacity-100">
          <span className="border-b border-[var(--color-bg)]/40 pb-1 text-xs uppercase tracking-[0.12em] text-[var(--color-bg)]">
            View details
          </span>
        </div>
      </div>

      <div className="px-6 pb-6 pt-5">
        <h4 className="mb-1 font-serif text-xl text-[var(--color-ink)]">
          {product.name}
        </h4>
        <p className="mb-3 text-[13px] font-light text-[var(--color-muted)]">
          {product.meta}
        </p>
        <div className="flex items-baseline gap-2.5">
          <span className="font-serif text-xl text-[var(--color-ink)]">
            {formatINR(product.priceNow)}
          </span>
          <span className="text-[13px] text-[var(--color-muted)] line-through">
            {formatINR(product.priceWas)}
          </span>
          <span className="rounded-full bg-[var(--color-ink)] px-2.5 py-[3px] text-[11px] tracking-wide text-[var(--color-bg)]">
            Save {product.discountPercent}%
          </span>
        </div>
      </div>
    </Link>
  );
}
