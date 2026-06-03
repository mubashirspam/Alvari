"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import {
  categoryNodeHref,
  type CategoryTreeNode,
} from "@/features/category-tree/types";
import { buildImageKitUrl } from "@/lib/imagekit";

type Props = { tree: CategoryTreeNode[] };

export function CategoryBrowser({ tree }: Props) {
  const router = useRouter();
  const [path, setPath] = useState<CategoryTreeNode[]>([]);

  const current = path[path.length - 1] ?? null;
  const nodes = current ? current.children : tree;
  const parentHref = current ? categoryNodeHref(current) : null;

  function handleTile(node: CategoryTreeNode) {
    if (node.children.length > 0) {
      setPath((p) => [...p, node]);
      return;
    }
    const href = categoryNodeHref(node);
    if (href) router.push(href);
  }

  return (
    <section className="bg-[var(--color-bg)] py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-12">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Shop by category
            </p>
            <h2 className="font-serif text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
              {current ? current.name : "Built for every room"}
            </h2>
          </div>
          {parentHref ? (
            <Link
              href={parentHref}
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline"
            >
              View all {current?.name}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/products"
              className="hidden text-[13px] text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline md:inline-block"
            >
              View all →
            </Link>
          )}
        </div>

        {/* Breadcrumb */}
        {path.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--color-muted)]">
            <button
              type="button"
              onClick={() => setPath((p) => p.slice(0, -1))}
              className="mr-1 inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setPath([])}
              className="hover:text-[var(--color-ink)]"
            >
              All
            </button>
            {path.map((node, i) => (
              <span key={node.id} className="flex items-center gap-1.5">
                <span className="opacity-50">/</span>
                <button
                  type="button"
                  onClick={() => setPath((p) => p.slice(0, i + 1))}
                  className={
                    i === path.length - 1
                      ? "text-[var(--color-ink)]"
                      : "hover:text-[var(--color-ink)]"
                  }
                >
                  {node.name}
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 md:gap-6">
          {nodes.map((node) => {
            const img = node.imageKey
              ? buildImageKitUrl(node.imageKey, { width: 500, quality: 80, format: "auto" })
              : null;
            const drills = node.children.length > 0;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => handleTile(node)}
                className="group flex flex-col items-center gap-3 text-center"
              >
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-3xl"
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
                      sizes="(min-width: 768px) 16vw, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  {drills ? (
                    <span className="absolute right-2 top-2 rounded-full bg-[var(--color-ink)]/75 px-2 py-0.5 text-[10px] font-medium text-[var(--color-bg)] backdrop-blur">
                      {node.children.length}
                    </span>
                  ) : null}
                </div>
                <span className="text-[13px] font-medium leading-tight text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-accent)] md:text-[14px]">
                  {node.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
