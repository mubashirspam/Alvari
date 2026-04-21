"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL } from "@/features/products/types";
import { slugify, rupeesToPaise, paiseToRupees } from "@/lib/admin/slugify";
import type { ProductRow } from "@/lib/db/schema";

const BADGES = ["bestseller", "new", "trending", "value_pick", "best_value", ""] as const;
const ILLUSTRATION_KEYS = ["almirah", "bed", "sofa", "dining", "dressing", "coffee_table", "mattress", "room_set", "custom"];

type Props = {
  product?: ProductRow;
};

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit && nameRef.current && slugRef.current) {
      const input = nameRef.current;
      const slug = slugRef.current;
      const handler = () => { slug.value = slugify(input.value); };
      input.addEventListener("input", handler);
      return () => input.removeEventListener("input", handler);
    }
  }, [isEdit]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);

    const priceNow = Number(fd.get("priceNow") ?? 0);
    const priceWas = Number(fd.get("priceWas") ?? 0);

    const body: Record<string, unknown> = {
      slug: fd.get("slug"),
      name: fd.get("name"),
      category: fd.get("category"),
      meta: fd.get("meta"),
      description: fd.get("description"),
      longDescription: fd.get("longDescription") || null,
      brand: fd.get("brand") || "Kaasth",
      material: fd.get("material") || null,
      warrantyMonths: Number(fd.get("warrantyMonths") ?? 12),
      careInstructions: fd.get("careInstructions") || null,
      dimensions: fd.get("dimensions") || null,
      weightKg: fd.get("weightKg") || null,
      priceNowInPaise: rupeesToPaise(priceNow),
      priceWasInPaise: rupeesToPaise(priceWas),
      badge: fd.get("badge") || null,
      illustrationKey: fd.get("illustrationKey"),
      gradientFrom: fd.get("gradientFrom"),
      gradientTo: fd.get("gradientTo"),
      isFeatured: fd.get("isFeatured") === "on",
      isActive: fd.get("isActive") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? 0),
    };

    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/admin/products/${product!.id}`
        : "/api/admin/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? "Save failed");
      }
      const data = (await res.json()) as { product: ProductRow };
      setSuccess(true);
      if (!isEdit) {
        router.replace(`/admin/products/${data.product.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const p = product;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h3 className="mb-5 font-serif text-[20px] text-[var(--color-ink)]">Basic info</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="pf-name">Product name *</Label>
            <Input id="pf-name" name="name" ref={nameRef} required defaultValue={p?.name} />
          </div>
          <div>
            <Label htmlFor="pf-slug">URL slug *</Label>
            <Input
              id="pf-slug"
              name="slug"
              ref={slugRef}
              required
              defaultValue={p?.slug}
              readOnly={isEdit}
              className={isEdit ? "bg-[var(--color-bg-soft)] opacity-60" : ""}
            />
          </div>
          <div>
            <Label htmlFor="pf-category">Category *</Label>
            <select
              id="pf-category"
              name="category"
              required
              defaultValue={p?.category ?? ""}
              className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="" disabled>Select category</option>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="pf-meta">Meta line (shown under title)</Label>
            <Input id="pf-meta" name="meta" defaultValue={p?.meta} required />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="pf-desc">Short description *</Label>
          <Textarea id="pf-desc" name="description" required defaultValue={p?.description} rows={3} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h3 className="mb-5 font-serif text-[20px] text-[var(--color-ink)]">
          Long description <span className="text-sm font-light text-[var(--color-muted)]">(markdown)</span>
        </h3>
        <Textarea
          name="longDescription"
          defaultValue={p?.longDescription ?? ""}
          rows={12}
          placeholder={`## Why this piece lasts\n\nWrite markdown here — headers, bold, lists...`}
          className="font-mono text-[13px] leading-relaxed"
        />
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h3 className="mb-5 font-serif text-[20px] text-[var(--color-ink)]">Pricing</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="pf-now">Sale price (₹) *</Label>
            <Input
              id="pf-now"
              name="priceNow"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={p ? paiseToRupees(p.priceNowInPaise) : ""}
            />
          </div>
          <div>
            <Label htmlFor="pf-was">Original price (₹) *</Label>
            <Input
              id="pf-was"
              name="priceWas"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={p ? paiseToRupees(p.priceWasInPaise) : ""}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h3 className="mb-5 font-serif text-[20px] text-[var(--color-ink)]">Specs &amp; materials</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="pf-brand">Brand</Label>
            <Input id="pf-brand" name="brand" defaultValue={p?.brand ?? "Kaasth"} />
          </div>
          <div>
            <Label htmlFor="pf-material">Material</Label>
            <Input id="pf-material" name="material" defaultValue={p?.material ?? ""} placeholder="Solid Sheesham" />
          </div>
          <div>
            <Label htmlFor="pf-warranty">Warranty (months)</Label>
            <Input id="pf-warranty" name="warrantyMonths" type="number" min="0" defaultValue={p?.warrantyMonths ?? 12} />
          </div>
          <div>
            <Label htmlFor="pf-weight">Weight (kg)</Label>
            <Input id="pf-weight" name="weightKg" type="number" min="0" step="0.01" defaultValue={p?.weightKg ?? ""} />
          </div>
          <div>
            <Label htmlFor="pf-dimensions">Dimensions</Label>
            <Input id="pf-dimensions" name="dimensions" defaultValue={p?.dimensions ?? ""} placeholder="72in H × 48in W × 22in D" />
          </div>
          <div>
            <Label htmlFor="pf-sort">Sort order</Label>
            <Input id="pf-sort" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="pf-care">Care instructions</Label>
          <Textarea id="pf-care" name="careInstructions" defaultValue={p?.careInstructions ?? ""} rows={3} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h3 className="mb-5 font-serif text-[20px] text-[var(--color-ink)]">Display</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="pf-badge">Badge</Label>
            <select
              id="pf-badge"
              name="badge"
              defaultValue={p?.badge ?? ""}
              className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">No badge</option>
              {BADGES.filter(Boolean).map((b) => (
                <option key={b} value={b}>{b.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="pf-illus">Illustration key (fallback icon)</Label>
            <select
              id="pf-illus"
              name="illustrationKey"
              defaultValue={p?.illustrationKey ?? "almirah"}
              className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              {ILLUSTRATION_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="pf-gfrom">Gradient from (hex)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="gradientFrom"
                id="pf-gfrom"
                defaultValue={p?.gradientFrom ?? "#8B5E3C"}
                className="h-11 w-12 cursor-pointer rounded border border-[var(--color-line)] p-1"
              />
              <span className="text-sm text-[var(--color-muted)]">Card gradient start</span>
            </div>
          </div>
          <div>
            <Label htmlFor="pf-gto">Gradient to (hex)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="gradientTo"
                id="pf-gto"
                defaultValue={p?.gradientTo ?? "#3E2818"}
                className="h-11 w-12 cursor-pointer rounded border border-[var(--color-line)] p-1"
              />
              <span className="text-sm text-[var(--color-muted)]">Card gradient end</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input type="checkbox" name="isFeatured" defaultChecked={p?.isFeatured ?? false} className="h-4 w-4" />
            Show on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} className="h-4 w-4" />
            Active (visible on site)
          </label>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--color-ink)] px-8 py-3.5 text-sm uppercase tracking-widest text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
        {success && !isEdit && (
          <span className="text-sm text-[var(--color-accent)]">Created!</span>
        )}
        {success && isEdit && (
          <span className="text-sm text-[var(--color-accent)]">Saved.</span>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </form>
  );
}
