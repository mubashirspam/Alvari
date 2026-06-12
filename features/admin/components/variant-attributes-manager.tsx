"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_LABEL } from "@/features/products/types";
import type { CategoryVariantAttributeRow } from "@/lib/db/schema";

type Category = CategoryVariantAttributeRow["category"];
type InputType = CategoryVariantAttributeRow["inputType"];

const INPUT_TYPE_LABEL: Record<InputType, string> = {
  select: "Choice chips",
  color: "Colour swatches",
  text: "Free text",
};

export function VariantAttributesManager({
  initialDefs,
}: {
  initialDefs: CategoryVariantAttributeRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingFor, setAddingFor] = useState<Category | null>(null);

  const byCategory = new Map<Category, CategoryVariantAttributeRow[]>();
  for (const def of initialDefs) {
    const list = byCategory.get(def.category) ?? [];
    list.push(def);
    byCategory.set(def.category, list);
  }

  async function call(path: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? "Request failed");
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(category: Category, form: HTMLFormElement) {
    const fd = new FormData(form);
    const ok = await call("/api/admin/variant-attributes", {
      method: "POST",
      body: JSON.stringify({
        category,
        key: String(fd.get("key") ?? "").trim(),
        label: String(fd.get("label") ?? "").trim(),
        inputType: String(fd.get("inputType") ?? "select"),
        options: splitOptions(String(fd.get("options") ?? "")),
        isRequired: fd.get("isRequired") === "on",
      }),
    });
    if (ok) setAddingFor(null);
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {(Object.keys(CATEGORY_LABEL) as Category[]).map((category) => {
        const defs = byCategory.get(category) ?? [];
        return (
          <section
            key={category}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg text-[var(--color-ink)]">
                {CATEGORY_LABEL[category]}
              </h2>
              <button
                onClick={() => setAddingFor(addingFor === category ? null : category)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-1.5 text-xs text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {addingFor === category ? (
                  <>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Add attribute
                  </>
                )}
              </button>
            </div>

            {defs.length === 0 && addingFor !== category && (
              <p className="text-sm text-[var(--color-muted)]">
                No attributes — variants of this category use the plain name field.
              </p>
            )}

            <div className="space-y-3">
              {defs.map((def) => (
                <AttributeRow key={def.id} def={def} busy={busy} call={call} />
              ))}
            </div>

            {addingFor === category && (
              <form
                className="mt-4 grid gap-3 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg)] p-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleCreate(category, e.currentTarget);
                }}
              >
                <div>
                  <Label htmlFor={`key-${category}`}>Key (internal, e.g. doors)</Label>
                  <Input id={`key-${category}`} name="key" required placeholder="doors" />
                </div>
                <div>
                  <Label htmlFor={`label-${category}`}>Label (shown to customers)</Label>
                  <Input id={`label-${category}`} name="label" required placeholder="Doors" />
                </div>
                <div>
                  <Label htmlFor={`type-${category}`}>Input type</Label>
                  <select
                    id={`type-${category}`}
                    name="inputType"
                    defaultValue="select"
                    className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
                  >
                    {(Object.keys(INPUT_TYPE_LABEL) as InputType[]).map((t) => (
                      <option key={t} value={t}>
                        {INPUT_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor={`options-${category}`}>Options (separate with |)</Label>
                  <Input
                    id={`options-${category}`}
                    name="options"
                    placeholder="2 Door | 3 Door | 4 Door"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" name="isRequired" defaultChecked className="h-4 w-4" />
                  Required when creating variants
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Add"}
                  </button>
                </div>
              </form>
            )}
          </section>
        );
      })}
    </div>
  );
}

function AttributeRow({
  def,
  busy,
  call,
}: {
  def: CategoryVariantAttributeRow;
  busy: boolean;
  call: (path: string, init: RequestInit) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);

  async function handleSave(form: HTMLFormElement) {
    const fd = new FormData(form);
    const ok = await call(`/api/admin/variant-attributes/${def.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        label: String(fd.get("label") ?? "").trim(),
        inputType: String(fd.get("inputType") ?? def.inputType),
        options: splitOptions(String(fd.get("options") ?? "")),
        isRequired: fd.get("isRequired") === "on",
      }),
    });
    if (ok) setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${def.label}"? Existing variants keep their values; new variants stop asking for it.`)) {
      return;
    }
    await call(`/api/admin/variant-attributes/${def.id}`, { method: "DELETE" });
  }

  if (editing) {
    return (
      <form
        className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave(e.currentTarget);
        }}
      >
        <div>
          <Label htmlFor={`elabel-${def.id}`}>Label</Label>
          <Input id={`elabel-${def.id}`} name="label" defaultValue={def.label} required />
        </div>
        <div>
          <Label htmlFor={`etype-${def.id}`}>Input type</Label>
          <select
            id={`etype-${def.id}`}
            name="inputType"
            defaultValue={def.inputType}
            className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            {(Object.keys(INPUT_TYPE_LABEL) as InputType[]).map((t) => (
              <option key={t} value={t}>
                {INPUT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`eoptions-${def.id}`}>Options (separate with |)</Label>
          <Input
            id={`eoptions-${def.id}`}
            name="options"
            defaultValue={def.options.join(" | ")}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input type="checkbox" name="isRequired" defaultChecked={def.isRequired} className="h-4 w-4" />
          Required when creating variants
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-[var(--color-line)] px-5 py-2.5 text-xs text-[var(--color-ink)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          {def.label}{" "}
          <span className="font-mono text-xs text-[var(--color-muted)]">({def.key})</span>
          {!def.isRequired && (
            <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
              optional
            </span>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[var(--color-bg-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {INPUT_TYPE_LABEL[def.inputType]}
          </span>
          {def.options.map((o) => (
            <span
              key={o}
              className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]"
            >
              {o}
            </span>
          ))}
          {def.options.length === 0 && def.inputType !== "text" && (
            <span className="text-xs text-amber-700">No options yet — add some</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
        >
          Edit
        </button>
        <button
          onClick={() => void handleDelete()}
          disabled={busy}
          aria-label={`Delete ${def.label}`}
          className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs text-red-700 hover:border-red-300 disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function splitOptions(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}
