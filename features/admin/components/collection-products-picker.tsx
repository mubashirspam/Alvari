"use client";

import { useMemo, useState, useTransition } from "react";
import type { Product } from "@/features/products/types";
import { setCollectionProductsAction } from "@/app/admin/(dashboard)/collections/actions";

type Props = {
  collectionId: string;
  allProducts: Pick<Product, "id" | "slug" | "name" | "category" | "imageUrl">[];
  initialSelectedIds: string[];
};

export function CollectionProductsPicker({
  collectionId,
  allProducts,
  initialSelectedIds,
}: Props) {
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [allProducts, search]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setStatus("idle");
  }

  function move(id: string, dir: -1 | 1) {
    setSelected((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
    setStatus("idle");
  }

  function save() {
    startTransition(async () => {
      try {
        await setCollectionProductsAction(collectionId, selected);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    });
  }

  const productMap = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Selected ({selected.length})
        </p>
        <div className="space-y-2 rounded-xl border border-[var(--color-line)] p-3">
          {selected.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No products selected yet.</p>
          ) : (
            selected.map((id, i) => {
              const p = productMap.get(id);
              if (!p) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-soft)] p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-9 w-9 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 flex-shrink-0 rounded bg-white" />
                  )}
                  <div className="flex-1 truncate text-sm text-[var(--color-ink)]">
                    {p.name}
                  </div>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(id, -1)}
                    className="rounded border border-[var(--color-line)] px-1.5 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === selected.length - 1}
                    onClick={() => move(id, 1)}
                    className="rounded border border-[var(--color-line)] px-1.5 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="rounded border border-red-200 px-1.5 text-xs text-red-700"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
          All products
        </p>
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
        />
        <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-xl border border-[var(--color-line)] p-2">
          {filtered.map((p) => {
            const inSet = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition ${
                  inSet
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "hover:bg-[var(--color-bg-soft)]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 flex-shrink-0 rounded bg-[var(--color-bg-soft)]" />
                )}
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  {p.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-2 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-sm text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save product list"}
        </button>
        {status === "saved" ? (
          <span className="text-sm text-green-700">Saved.</span>
        ) : null}
        {status === "error" ? (
          <span className="text-sm text-red-700">Save failed.</span>
        ) : null}
      </div>
    </div>
  );
}
