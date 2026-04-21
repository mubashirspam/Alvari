"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paiseToRupees, rupeesToPaise } from "@/lib/admin/slugify";
import type { ProductVariantRow, VariantAttributes } from "@/lib/db/schema";
import { formatINR } from "@/lib/utils";

type AttrPair = { key: string; value: string };

function attrsToRows(attrs: VariantAttributes): AttrPair[] {
  return Object.entries(attrs).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

function rowsToAttrs(rows: AttrPair[]): VariantAttributes {
  const out: VariantAttributes = {};
  for (const { key, value } of rows) {
    if (!key.trim()) continue;
    const numVal = Number(value);
    if (!Number.isNaN(numVal) && value.trim() !== "") {
      out[key.trim()] = numVal;
    } else if (value === "true") {
      out[key.trim()] = true;
    } else if (value === "false") {
      out[key.trim()] = false;
    } else {
      out[key.trim()] = value;
    }
  }
  return out;
}

function VariantRow({
  productId,
  variant,
  onSaved,
}: {
  productId: string;
  variant: ProductVariantRow;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attrs, setAttrs] = useState<AttrPair[]>(() =>
    attrsToRows(variant.attributes ?? {}),
  );

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const body = {
      sku: fd.get("sku"),
      name: fd.get("name"),
      priceNowInPaise: rupeesToPaise(Number(fd.get("priceNow"))),
      priceWasInPaise: rupeesToPaise(Number(fd.get("priceWas"))),
      stock: Number(fd.get("stock") ?? 0),
      isDefault: fd.get("isDefault") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? 0),
      attributes: rowsToAttrs(attrs),
    };
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/products/${productId}/variants/${variant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error((await res.json() as { message: string }).message);
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete variant "${variant.name}"? This will also remove its images.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
      method: "DELETE",
    });
    onSaved();
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--color-line)] p-4">
        <div>
          <p className="font-medium text-[var(--color-ink)]">{variant.name}</p>
          <p className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
            {variant.sku} · {formatINR(paiseToRupees(variant.priceNowInPaise))} · stock: {variant.stock}
            {variant.isDefault && " · default"}
          </p>
          {Object.keys(variant.attributes ?? {}).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(variant.attributes ?? {}).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full bg-[var(--color-bg)] px-2.5 py-0.5 text-[11px] text-[var(--color-muted)]"
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-red-700 hover:border-red-400 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-xl border border-[var(--color-accent)] p-5"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>SKU *</Label>
          <Input name="sku" required defaultValue={variant.sku} />
        </div>
        <div>
          <Label>Variant name *</Label>
          <Input name="name" required defaultValue={variant.name} />
        </div>
        <div>
          <Label>Sale price (₹) *</Label>
          <Input
            name="priceNow"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={paiseToRupees(variant.priceNowInPaise)}
          />
        </div>
        <div>
          <Label>Original price (₹) *</Label>
          <Input
            name="priceWas"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={paiseToRupees(variant.priceWasInPaise)}
          />
        </div>
        <div>
          <Label>Stock quantity</Label>
          <Input name="stock" type="number" min="0" defaultValue={variant.stock} />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input name="sortOrder" type="number" defaultValue={variant.sortOrder} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
        <input type="checkbox" name="isDefault" defaultChecked={variant.isDefault} className="h-4 w-4" />
        Default variant (shown first on product page)
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Attributes (key → value)</Label>
          <button
            type="button"
            onClick={() => setAttrs((a) => [...a, { key: "", value: "" }])}
            className="text-xs text-[var(--color-accent)]"
          >
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          {attrs.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={row.key}
                onChange={(e) =>
                  setAttrs((a) =>
                    a.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)),
                  )
                }
                placeholder="key (e.g. doors)"
                className="flex-1"
              />
              <Input
                value={row.value}
                onChange={(e) =>
                  setAttrs((a) =>
                    a.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)),
                  )
                }
                placeholder="value (e.g. 3 or true)"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setAttrs((a) => a.filter((_, i) => i !== idx))}
                className="rounded border border-[var(--color-line)] px-3 text-xs text-red-700 hover:border-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-bg)] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save variant"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-[var(--color-line)] px-6 py-2.5 text-xs text-[var(--color-ink)]"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  );
}

function AddVariantForm({
  productId,
  onSaved,
}: {
  productId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attrs, setAttrs] = useState<AttrPair[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const body = {
      sku: fd.get("sku"),
      name: fd.get("name"),
      priceNowInPaise: rupeesToPaise(Number(fd.get("priceNow"))),
      priceWasInPaise: rupeesToPaise(Number(fd.get("priceWas"))),
      stock: Number(fd.get("stock") ?? 0),
      isDefault: fd.get("isDefault") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? 0),
      attributes: rowsToAttrs(attrs),
    };
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json() as { message: string }).message);
      setOpen(false);
      setAttrs([]);
      (event.target as HTMLFormElement).reset();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-[var(--color-line)] py-3 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
      >
        + Add variant
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-5"
    >
      <p className="text-sm font-medium text-[var(--color-ink)]">New variant</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div><Label>SKU *</Label><Input name="sku" required placeholder="ALM-HEIR-2D-NAT" /></div>
        <div><Label>Variant name *</Label><Input name="name" required placeholder="2-Door · Natural" /></div>
        <div>
          <Label>Sale price (₹) *</Label>
          <Input name="priceNow" type="number" min="0" step="0.01" required />
        </div>
        <div>
          <Label>Original price (₹) *</Label>
          <Input name="priceWas" type="number" min="0" step="0.01" required />
        </div>
        <div><Label>Stock</Label><Input name="stock" type="number" min="0" defaultValue="0" /></div>
        <div><Label>Sort order</Label><Input name="sortOrder" type="number" defaultValue="0" /></div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
        <input type="checkbox" name="isDefault" className="h-4 w-4" />
        Default variant
      </label>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Attributes</Label>
          <button
            type="button"
            onClick={() => setAttrs((a) => [...a, { key: "", value: "" }])}
            className="text-xs text-[var(--color-accent)]"
          >
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          {attrs.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={row.key}
                onChange={(e) => setAttrs((a) => a.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)))}
                placeholder="key"
                className="flex-1"
              />
              <Input
                value={row.value}
                onChange={(e) => setAttrs((a) => a.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)))}
                placeholder="value"
                className="flex-1"
              />
              <button type="button" onClick={() => setAttrs((a) => a.filter((_, i) => i !== idx))} className="rounded border border-[var(--color-line)] px-3 text-xs text-red-700">✕</button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-bg)] disabled:opacity-60">
          {saving ? "Saving…" : "Create variant"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[var(--color-line)] px-6 py-2.5 text-xs text-[var(--color-ink)]">
          Cancel
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  );
}

export function VariantManager({
  productId,
  initialVariants,
}: {
  productId: string;
  initialVariants: ProductVariantRow[];
}) {
  const router = useRouter();
  const [variants, setVariants] = useState(initialVariants);

  async function reload() {
    const res = await fetch(`/api/admin/products/${productId}/variants`);
    if (res.ok) {
      const data = (await res.json()) as { variants: ProductVariantRow[] };
      setVariants(data.variants);
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {variants.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--color-muted)]">
          No variants yet. Add one below.
        </p>
      )}
      {variants.map((v) => (
        <VariantRow
          key={v.id}
          productId={productId}
          variant={v}
          onSaved={reload}
        />
      ))}
      <AddVariantForm productId={productId} onSaved={reload} />
    </div>
  );
}
