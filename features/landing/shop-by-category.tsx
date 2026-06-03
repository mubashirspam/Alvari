import Image from "next/image";
import Link from "next/link";
import { getVisibleCategories } from "@/features/categories/services/category-service";
import { getVisibleTree } from "@/features/category-tree/services/category-tree-service";
import { buildImageKitUrl } from "@/lib/imagekit";
import { CategoryBrowser } from "./category-browser";

export async function ShopByCategory() {
  const tree = await getVisibleTree();

  // Prefer the admin-managed hierarchy. Fall back to the flat category list so the
  // homepage is never blank before the tree is seeded.
  if (tree.length > 0) {
    return <CategoryBrowser tree={tree} />;
  }

  const categories = await getVisibleCategories();
  if (categories.length === 0) return null;

  return (
    <section className="bg-[var(--color-bg)] py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="mb-8 flex items-end justify-between md:mb-12">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Shop by category
            </p>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
              Built for every room
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden text-[13px] text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline md:inline-block"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-7 md:gap-6">
          {categories.map((c) => (
            <Link
              key={c.category}
              href={`/products?category=${c.category}`}
              className="group flex flex-col items-center gap-3 text-center"
            >
              <div
                className="relative aspect-square w-full overflow-hidden rounded-3xl"
                style={{
                  background: c.accentColor
                    ? `linear-gradient(145deg, ${c.accentColor}22, ${c.accentColor}11)`
                    : "var(--color-bg-soft)",
                }}
              >
                {c.imageKey ? (
                  <Image
                    src={buildImageKitUrl(c.imageKey, { width: 400, quality: 80, format: "auto" })}
                    alt={c.label}
                    fill
                    sizes="(min-width: 768px) 14vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : null}
              </div>
              <span className="text-[12px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)] md:text-[13px]">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
