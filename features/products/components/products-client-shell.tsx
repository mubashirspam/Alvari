"use client";

import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/features/products/components/product-card";
import { CATEGORY_LABEL, type Product, type ProductCategory } from "@/features/products/types";

type Props = {
  products: Product[];
  initialCategory?: ProductCategory | null;
  initialQuery?: string | null;
};

const CATEGORIES = Object.entries(CATEGORY_LABEL) as [ProductCategory, string][];

export function ProductsClientShell({ products, initialCategory, initialQuery }: Props) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(
    initialCategory ?? null,
  );
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.material ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, activeCategory, query]);

  const hasFilter = activeCategory !== null || query.trim() !== "";

  function clearAll() {
    setQuery("");
    setActiveCategory(null);
  }

  return (
    <div>
      {/* ── Search + filter bar ── */}
      <div className="sticky top-[72px] z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] px-4 md:px-12">
          <div className="flex items-center gap-3 py-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                strokeWidth={1.8}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search beds, sofas, wardrobes…"
                className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg-soft)] py-2.5 pl-10 pr-4 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/15 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile: toggle filter pills */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-[13px] font-medium transition-colors md:hidden ${
                activeCategory
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border-[var(--color-line)] text-[var(--color-muted)]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.8} />
              Filter
            </button>

            {/* Clear all */}
            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="hidden whitespace-nowrap rounded-full border border-[var(--color-line)] px-3.5 py-2.5 text-[13px] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] md:inline-flex items-center gap-1.5"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          {/* Category pills — always visible on desktop, toggle on mobile */}
          <div className={`pb-3 ${showFilters ? "block" : "hidden md:block"}`}>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  !activeCategory
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                }`}
              >
                All
              </button>
              {CATEGORIES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setActiveCategory(activeCategory === value ? null : value)
                  }
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                    activeCategory === value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-8 md:px-12">
        {hasFilter && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[13px] text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-ink)]">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "result" : "results"}
              {activeCategory && (
                <span> in {CATEGORY_LABEL[activeCategory]}</span>
              )}
              {query && <span> for &ldquo;{query}&rdquo;</span>}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-[12px] text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline md:hidden"
            >
              Clear all
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="font-serif text-[24px] text-[var(--color-ink)]">
              No results found
            </p>
            <p className="mt-2 text-[14px] text-[var(--color-muted)]">
              Try a different search or category
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-6 rounded-full border border-[var(--color-line)] px-6 py-2.5 text-[13px] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-7">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
