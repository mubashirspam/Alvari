"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  categoryNodeHref,
  type CategoryTreeNode,
} from "@/features/category-tree/types";
import { buildImageKitUrl } from "@/lib/imagekit";

type Props = {
  tree: CategoryTreeNode[];
  overline?: string | null;
  title?: string | null;
  /** Override the outer <section> classes (padding/background). */
  className?: string;
};

export function CategoryBrowser({
  tree,
  overline = "Shop by category",
  title = "Shop all things home",
  className = "bg-[var(--color-bg)] py-14 md:py-20",
}: Props) {
  const router = useRouter();
  const [rootId, setRootId] = useState<string>(tree[0]?.id ?? "");
  const [subId, setSubId] = useState<string>("");

  const activeRoot = tree.find((r) => r.id === rootId) ?? tree[0] ?? null;
  const subCats = activeRoot?.children ?? [];
  // Show a pill row only when there's a genuine third level to drill into.
  const hasThirdLevel = subCats.some((n) => n.children.length > 0);

  const activeSub = useMemo(() => {
    if (!hasThirdLevel) return null;
    return (
      subCats.find((n) => n.id === subId) ??
      subCats.find((n) => n.children.length > 0) ??
      subCats[0] ??
      null
    );
  }, [hasThirdLevel, subCats, subId]);

  // Tiles = third level (when drilling), otherwise the sub-categories directly.
  const tiles = hasThirdLevel ? (activeSub?.children ?? []) : subCats;
  const emptyHref = activeSub
    ? categoryNodeHref(activeSub)
    : categoryNodeHref(activeRoot ?? ({} as CategoryTreeNode));

  function selectRoot(id: string) {
    setRootId(id);
    setSubId("");
  }

  function openTile(node: CategoryTreeNode) {
    if (node.children.length > 0) {
      // A tile that itself has children behaves like a sub-category selector.
      setSubId(node.id);
      return;
    }
    const href = categoryNodeHref(node);
    if (href) router.push(href);
  }

  if (!activeRoot) return null;

  return (
    <section className={className}>
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        {overline || title ? (
          <div className="mb-8 text-center md:mb-10">
            {overline ? (
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-accent)]">
                {overline}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
                {title}
              </h2>
            ) : null}
          </div>
        ) : null}

        {/* Top-level tabs (underline indicator) — scrolls horizontally on mobile */}
        <div className="mb-7 -mx-6 flex gap-x-6 overflow-x-auto border-b border-[var(--color-line)] px-6 [scrollbar-width:none] md:mx-0 md:justify-center md:gap-x-10 md:px-0 [&::-webkit-scrollbar]:hidden">
          {tree.map((root) => {
            const active = root.id === activeRoot.id;
            return (
              <button
                key={root.id}
                type="button"
                onClick={() => selectRoot(root.id)}
                className={`relative -mb-px shrink-0 whitespace-nowrap px-1 pb-3 text-[15px] font-medium transition-colors md:px-2 md:text-[16px] ${
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {root.name}
                {active ? (
                  <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-[var(--color-accent)]" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Second-level pills — scrolls horizontally on mobile */}
        {hasThirdLevel ? (
          <div className="mb-9 -mx-6 flex gap-2.5 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:flex-wrap md:justify-center md:px-0 [&::-webkit-scrollbar]:hidden">
            {subCats.map((sub) => {
              const active = sub.id === activeSub?.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubId(sub.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2 text-[13.5px] font-medium transition ${
                    active
                      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Tiles */}
        {tiles.length > 0 ? (
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-4 md:grid-cols-6 md:gap-6">
            {tiles.map((node) => {
              const img = node.imageKey
                ? buildImageKitUrl(node.imageKey, { width: 400, quality: 80, format: "auto" })
                : null;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => openTile(node)}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className="relative aspect-square w-full overflow-hidden rounded-2xl"
                    style={{
                      background: node.accentColor
                        ? `linear-gradient(145deg, ${node.accentColor}22, ${node.accentColor}11)`
                        : "var(--color-bg-soft)",
                    }}
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={node.name}
                        fill
                        sizes="(min-width: 768px) 16vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)] md:text-[13px]">
                    {node.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Link
              href={emptyHref ?? "/products"}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--color-navy-deep)] transition hover:bg-[var(--color-accent-warm)]"
            >
              Browse {activeSub?.name ?? activeRoot.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
