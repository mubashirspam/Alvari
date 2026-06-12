"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paiseToRupees, rupeesToPaise } from "@/lib/admin/slugify";
import type {
  CategoryVariantAttributeRow,
  ProductVariantRow,
  VariantAttributes,
} from "@/lib/db/schema";
import { formatINR } from "@/lib/utils";

type AttrPair = { key: string; value: string };

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

/** Canonical signature of the def-keyed attribute combo, for duplicate detection. */
function comboSignature(
  attrs: VariantAttributes,
  defs: CategoryVariantAttributeRow[],
): string {
  return defs
    .map((d) => `${d.key}=${String(attrs[d.key] ?? "")}`)
    .join("|");
}

/**
 * Structured attribute fields driven by the category's definitions, plus
 * free-form rows for any extra keys not covered by a definition.
 */
function AttrFields({
  defs,
  values,
  onChange,
  extraRows,
  setExtraRows,
}: {
  defs: CategoryVariantAttributeRow[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  extraRows: AttrPair[];
  setExtraRows: React.Dispatch<React.SetStateAction<AttrPair[]>>;
}) {
  return (
    <div className="space-y-3">
      {defs.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {defs.map((def) => (
            <div key={def.id}>
              <Label>
                {def.label}
                {def.isRequired ? " *" : ""}
              </Label>
              {def.inputType === "text" ? (
                <Input
                  value={values[def.key] ?? ""}
                  onChange={(e) => onChange(def.key, e.target.value)}
                  required={def.isRequired}
                />
              ) : (
                <select
                  value={values[def.key] ?? ""}
                  onChange={(e) => onChange(def.key, e.target.value)}
                  required={def.isRequired}
                  className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="">
                    {def.isRequired ? `Select ${def.label.toLowerCase()}` : "—"}
                  </option>
                  {/* Current value first if it predates the definition's options. */}
                  {values[def.key] && !def.options.includes(values[def.key]) && (
                    <option value={values[def.key]}>
                      {values[def.key]} (legacy)
                    </option>
                  )}
                  {def.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>
            {defs.length > 0 ? "Extra attributes (optional)" : "Attributes (key → value)"}
          </Label>
          <button
            type="button"
            onClick={() => setExtraRows((a) => [...a, { key: "", value: "" }])}
            className="text-xs text-[var(--color-accent)]"
          >
            + Add row
          </button>
        </div>
        <div className="space-y-2">
          {extraRows.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={row.key}
                onChange={(e) =>
                  setExtraRows((a) =>
                    a.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r)),
                  )
                }
                placeholder="key (e.g. finish)"
                className="flex-1"
              />
              <Input
                value={row.value}
                onChange={(e) =>
                  setExtraRows((a) =>
                    a.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r)),
                  )
                }
                placeholder="value"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setExtraRows((a) => a.filter((_, i) => i !== idx))}
                className="rounded border border-[var(--color-line)] px-3 text-xs text-red-700 hover:border-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Splits a variant's attributes into def-keyed values and leftover rows. */
function splitAttrs(
  attrs: VariantAttributes,
  defs: CategoryVariantAttributeRow[],
): { defValues: Record<string, string>; extra: AttrPair[] } {
  const defKeys = new Set(defs.map((d) => d.key));
  const defValues: Record<string, string> = {};
  const extra: AttrPair[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (defKeys.has(key)) defValues[key] = String(value);
    else extra.push({ key, value: String(value) });
  }
  return { defValues, extra };
}

function mergeAttrs(
  defValues: Record<string, string>,
  extra: AttrPair[],
): VariantAttributes {
  const merged = rowsToAttrs(extra);
  for (const [key, value] of Object.entries(defValues)) {
    if (value !== "") merged[key] = value;
  }
  return merged;
}

function VariantRow({
  productId,
  variant,
  defs,
  siblings,
  onSaved,
}: {
  productId: string;
  variant: ProductVariantRow;
  defs: CategoryVariantAttributeRow[];
  siblings: ProductVariantRow[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initial = useMemo(
    () => splitAttrs(variant.attributes ?? {}, defs),
    [variant.attributes, defs],
  );
  const [defValues, setDefValues] = useState<Record<string, string>>(initial.defValues);
  const [extraRows, setExtraRows] = useState<AttrPair[]>(initial.extra);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const attributes = mergeAttrs(defValues, extraRows);

    const hasDefValues = defs.some((d) => String(attributes[d.key] ?? "") !== "");
    if (hasDefValues) {
      const sig = comboSignature(attributes, defs);
      const clash = siblings.find(
        (s) => s.id !== variant.id && comboSignature(s.attributes ?? {}, defs) === sig,
      );
      if (clash) {
        setError(`Variant "${clash.name}" already has this exact combination.`);
        return;
      }
    }

    const body = {
      sku: fd.get("sku"),
      name: fd.get("name"),
      priceNowInPaise: rupeesToPaise(Number(fd.get("priceNow"))),
      priceWasInPaise: rupeesToPaise(Number(fd.get("priceWas"))),
      stock: Number(fd.get("stock") ?? 0),
      isDefault: fd.get("isDefault") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? 0),
      attributes,
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
                  {defs.find((d) => d.key === k)?.label ?? k}: {String(v)}
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

      <AttrFields
        defs={defs}
        values={defValues}
        onChange={(key, value) => setDefValues((v) => ({ ...v, [key]: value }))}
        extraRows={extraRows}
        setExtraRows={setExtraRows}
      />

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
  defs,
  siblings,
  onSaved,
}: {
  productId: string;
  defs: CategoryVariantAttributeRow[];
  siblings: ProductVariantRow[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defValues, setDefValues] = useState<Record<string, string>>({});
  const [extraRows, setExtraRows] = useState<AttrPair[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const attributes = mergeAttrs(defValues, extraRows);

    const hasDefValues = defs.some((d) => String(attributes[d.key] ?? "") !== "");
    if (hasDefValues) {
      const sig = comboSignature(attributes, defs);
      const clash = siblings.find(
        (s) => comboSignature(s.attributes ?? {}, defs) === sig,
      );
      if (clash) {
        setError(`Variant "${clash.name}" already has this exact combination.`);
        return;
      }
    }

    const body = {
      sku: fd.get("sku"),
      name: fd.get("name"),
      priceNowInPaise: rupeesToPaise(Number(fd.get("priceNow"))),
      priceWasInPaise: rupeesToPaise(Number(fd.get("priceWas"))),
      stock: Number(fd.get("stock") ?? 0),
      isDefault: fd.get("isDefault") === "on",
      sortOrder: Number(fd.get("sortOrder") ?? 0),
      attributes,
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
      setDefValues({});
      setExtraRows([]);
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

      <AttrFields
        defs={defs}
        values={defValues}
        onChange={(key, value) => setDefValues((v) => ({ ...v, [key]: value }))}
        extraRows={extraRows}
        setExtraRows={setExtraRows}
      />

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

/**
 * Cartesian combination generator: tick the options you sell per attribute,
 * preview the combos, create them all in one go. Combos that already exist
 * are skipped automatically.
 */
function CombinationGenerator({
  productId,
  productName,
  defs,
  siblings,
  basePriceNowInPaise,
  basePriceWasInPaise,
  onSaved,
}: {
  productId: string;
  productName: string;
  defs: CategoryVariantAttributeRow[];
  siblings: ProductVariantRow[];
  basePriceNowInPaise: number;
  basePriceWasInPaise: number;
  onSaved: () => void;
}) {
  const selectDefs = defs.filter(
    (d) => d.inputType !== "text" && d.options.length > 0,
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});

  if (selectDefs.length === 0) return null;

  const combos: Record<string, string>[] = [];
  const activeDefs = selectDefs.filter((d) => (picked[d.key] ?? []).length > 0);
  if (activeDefs.length > 0) {
    let acc: Record<string, string>[] = [{}];
    for (const def of activeDefs) {
      const next: Record<string, string>[] = [];
      for (const combo of acc) {
        for (const option of picked[def.key]!) {
          next.push({ ...combo, [def.key]: option });
        }
      }
      acc = next;
    }
    combos.push(...acc);
  }

  const existingSigs = new Set(
    siblings.map((s) => comboSignature(s.attributes ?? {}, defs)),
  );
  const fresh = combos.filter(
    (c) => !existingSigs.has(comboSignature(c, defs)),
  );

  function toggle(key: string, option: string) {
    setPicked((p) => {
      const current = p[key] ?? [];
      return {
        ...p,
        [key]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
  }

  function comboName(combo: Record<string, string>): string {
    return activeDefs.map((d) => combo[d.key]).join(" · ");
  }

  function comboSku(combo: Record<string, string>): string {
    const base = productName
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 6);
    const suffix = activeDefs
      .map((d) =>
        combo[d.key]
          .replace(/[^a-zA-Z0-9]+/g, "")
          .toUpperCase()
          .slice(0, 4),
      )
      .join("-");
    return `${base}-${suffix}`;
  }

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    let created = 0;
    try {
      for (let i = 0; i < fresh.length; i++) {
        const combo = fresh[i];
        const res = await fetch(`/api/admin/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: comboSku(combo),
            name: comboName(combo),
            priceNowInPaise: basePriceNowInPaise,
            priceWasInPaise: basePriceWasInPaise,
            stock: 0,
            isDefault: siblings.length === 0 && i === 0,
            sortOrder: siblings.length + i,
            attributes: combo,
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { message?: string };
          throw new Error(
            `${comboName(combo)}: ${data.message ?? "failed"} (${created} created so far)`,
          );
        }
        created++;
      }
      setOpen(false);
      setPicked({});
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      if (created > 0) onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-[var(--color-line)] py-3 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
      >
        ⚡ Generate combinations ({selectDefs.map((d) => d.label).join(" × ")})
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-5">
      <p className="text-sm font-medium text-[var(--color-ink)]">
        Generate variant combinations
      </p>
      {selectDefs.map((def) => (
        <div key={def.id}>
          <Label>{def.label}</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {def.options.map((option) => {
              const active = (picked[def.key] ?? []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(def.key, option)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                    active
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                      : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {combos.length > 0 && (
        <div className="rounded-lg bg-[var(--color-bg)] p-3 text-sm text-[var(--color-muted)]">
          {fresh.length} new variant{fresh.length === 1 ? "" : "s"} will be created
          at {formatINR(paiseToRupees(basePriceNowInPaise))} (edit prices after):
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fresh.slice(0, 24).map((c) => (
              <span
                key={comboSignature(c, defs)}
                className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]"
              >
                {comboName(c)}
              </span>
            ))}
            {fresh.length > 24 && <span>… +{fresh.length - 24} more</span>}
          </div>
          {combos.length !== fresh.length && (
            <p className="mt-2 text-xs">
              {combos.length - fresh.length} combo(s) already exist and will be skipped.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={busy || fresh.length === 0}
          className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-bg)] disabled:opacity-60"
        >
          {busy ? "Creating…" : `Create ${fresh.length} variant${fresh.length === 1 ? "" : "s"}`}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-[var(--color-line)] px-6 py-2.5 text-xs text-[var(--color-ink)]"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </div>
  );
}

export function VariantManager({
  productId,
  productName,
  initialVariants,
  attributeDefs = [],
  basePriceNowInPaise = 0,
  basePriceWasInPaise = 0,
}: {
  productId: string;
  productName?: string;
  initialVariants: ProductVariantRow[];
  attributeDefs?: CategoryVariantAttributeRow[];
  basePriceNowInPaise?: number;
  basePriceWasInPaise?: number;
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
          No variants yet. Add one below{attributeDefs.length > 0 ? " or generate combinations" : ""}.
        </p>
      )}
      {variants.map((v) => (
        <VariantRow
          key={v.id}
          productId={productId}
          variant={v}
          defs={attributeDefs}
          siblings={variants}
          onSaved={reload}
        />
      ))}
      <CombinationGenerator
        productId={productId}
        productName={productName ?? "VAR"}
        defs={attributeDefs}
        siblings={variants}
        basePriceNowInPaise={basePriceNowInPaise}
        basePriceWasInPaise={basePriceWasInPaise}
        onSaved={reload}
      />
      <AddVariantForm
        productId={productId}
        defs={attributeDefs}
        siblings={variants}
        onSaved={reload}
      />
    </div>
  );
}
