"use client";

import { useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import { CATEGORY_LABEL } from "@/features/products/types";
import {
  buildTree,
  categoryNodeHref,
  type CategoryNode,
  type CategoryTreeNode,
} from "@/features/category-tree/types";
import { buildImageKitUrl } from "@/lib/imagekit";

type Props = { initialTree: CategoryTreeNode[] };

type FlatOption = { id: string; label: string };

function flattenForPicker(
  nodes: CategoryTreeNode[],
  prefix = "",
): FlatOption[] {
  const out: FlatOption[] = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} › ${n.name}` : n.name;
    out.push({ id: n.id, label });
    if (n.children.length) out.push(...flattenForPicker(n.children, label));
  }
  return out;
}

export function CategoryTreeManager({ initialTree }: Props) {
  const [tree, setTree] = useState<CategoryTreeNode[]>(initialTree);
  const [addingRoot, setAddingRoot] = useState(false);

  async function reload() {
    const res = await fetch("/api/admin/category-nodes");
    if (res.ok) {
      const { nodes } = (await res.json()) as { nodes: CategoryNode[] };
      setTree(buildTree(nodes));
    }
  }

  const parentOptions = flattenForPicker(tree);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {tree.length} top-level {tree.length === 1 ? "category" : "categories"}
        </p>
        <button
          type="button"
          onClick={() => setAddingRoot((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--color-navy-deep)] transition hover:bg-[var(--color-accent-warm)]"
        >
          <Plus className="h-4 w-4" /> Add top-level
        </button>
      </div>

      {addingRoot ? (
        <NodeForm
          parentId={null}
          parentOptions={parentOptions}
          onDone={() => {
            setAddingRoot(false);
            reload();
          }}
          onCancel={() => setAddingRoot(false)}
        />
      ) : null}

      <div className="space-y-2">
        {tree.map((node) => (
          <NodeRow
            key={node.id}
            node={node}
            depth={0}
            parentOptions={parentOptions}
            onChanged={reload}
          />
        ))}
        {tree.length === 0 && !addingRoot ? (
          <p className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-sm text-[var(--color-muted)]">
            No categories yet. Add a top-level category to get started.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function NodeRow({
  node,
  depth,
  parentOptions,
  onChanged,
}: {
  node: CategoryTreeNode;
  depth: number;
  parentOptions: FlatOption[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [open, setOpen] = useState(true);

  const href = categoryNodeHref(node);
  const thumb = node.imageKey
    ? buildImageKitUrl(node.imageKey, { width: 120, height: 120, quality: 70, format: "auto" })
    : null;

  async function handleDelete() {
    if (
      !confirm(
        `Delete "${node.name}"${node.children.length ? " and all its sub-categories" : ""}?`,
      )
    )
      return;
    const res = await fetch(`/api/admin/category-nodes/${node.id}`, { method: "DELETE" });
    if (res.ok) onChanged();
    else alert("Delete failed");
  }

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-muted)] transition ${node.children.length ? "hover:bg-[var(--color-bg-soft)]" : "opacity-0"}`}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>

        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-soft)]">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-[var(--color-ink)]">
              {node.name}
            </span>
            {!node.isVisible ? (
              <span className="rounded-full bg-[var(--color-bg-soft)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                Hidden
              </span>
            ) : null}
          </div>
          <p className="truncate text-[12px] text-[var(--color-muted)]">
            /{node.slug}
            {href ? <span className="text-[var(--color-accent)]"> → {href}</span> : null}
            {node.children.length ? ` · ${node.children.length} child${node.children.length > 1 ? "ren" : ""}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAddingChild((v) => !v)}
            title="Add sub-category"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink)]"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            title="Edit"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink)]"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title="Delete"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-700 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-2" style={{ marginLeft: 20 }}>
          <NodeForm
            node={node}
            parentOptions={parentOptions}
            onDone={() => {
              setEditing(false);
              onChanged();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : null}

      {addingChild ? (
        <div className="mt-2" style={{ marginLeft: 20 }}>
          <NodeForm
            parentId={node.id}
            parentOptions={parentOptions}
            onDone={() => {
              setAddingChild(false);
              onChanged();
            }}
            onCancel={() => setAddingChild(false)}
          />
        </div>
      ) : null}

      {open && node.children.length
        ? node.children.map((child) => (
            <div key={child.id} className="mt-2">
              <NodeRow
                node={child}
                depth={depth + 1}
                parentOptions={parentOptions}
                onChanged={onChanged}
              />
            </div>
          ))
        : null}
    </div>
  );
}

function NodeForm({
  node,
  parentId,
  parentOptions,
  onDone,
  onCancel,
}: {
  node?: CategoryNode;
  parentId?: string | null;
  parentOptions: FlatOption[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(node);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultParent = isEdit ? (node?.parentId ?? "") : (parentId ?? "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      slug: String(fd.get("slug") ?? "").trim(),
      parentId: (fd.get("parentId") as string) || null,
      imageKey: (fd.get("imageKey") as string) || null,
      accentColor: (fd.get("accentColor") as string) || null,
      linkCategory: (fd.get("linkCategory") as string) || null,
      material: (fd.get("material") as string) || null,
      linkHref: (fd.get("linkHref") as string) || null,
      sortOrder: Number(fd.get("sortOrder") ?? 0),
      isVisible: fd.get("isVisible") === "on",
    };
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/category-nodes/${node!.id}` : "/api/admin/category-nodes",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? "Save failed");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="cn-name">Name *</Label>
          <Input id="cn-name" name="name" required defaultValue={node?.name ?? ""} placeholder="Solid Wood" />
        </div>
        <div>
          <Label htmlFor="cn-slug">Slug *</Label>
          <Input id="cn-slug" name="slug" required defaultValue={node?.slug ?? ""} placeholder="solid-wood" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="cn-parent">Parent</Label>
          <select
            id="cn-parent"
            name="parentId"
            defaultValue={defaultParent}
            className="mt-1 w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">— Top level —</option>
            {parentOptions
              .filter((o) => o.id !== node?.id)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label htmlFor="cn-sort">Sort order</Label>
          <Input id="cn-sort" name="sortOrder" type="number" defaultValue={node?.sortOrder ?? 0} />
        </div>
      </div>

      <ImageUploadField
        name="imageKey"
        folder="categories"
        label="Tile image"
        defaultValue={node?.imageKey ?? ""}
        aspectClass="aspect-square"
        hint="Square works best. Auto-optimised to under 300 KB."
      />

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-4">
        <p className="mb-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Where it links (leave blank for a drill-down container)
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="cn-linkcat">Product category</Label>
            <select
              id="cn-linkcat"
              name="linkCategory"
              defaultValue={node?.linkCategory ?? ""}
              className="mt-1 w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">— None —</option>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="cn-material">Material filter</Label>
            <Input id="cn-material" name="material" defaultValue={node?.material ?? ""} placeholder="solid / engineered" />
          </div>
          <div>
            <Label htmlFor="cn-href">Custom URL (overrides)</Label>
            <Input id="cn-href" name="linkHref" defaultValue={node?.linkHref ?? ""} placeholder="/products?room=living" />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
        <input type="checkbox" name="isVisible" defaultChecked={node?.isVisible ?? true} className="h-4 w-4" />
        Visible on site
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-[13px] font-semibold text-[var(--color-navy-deep)] transition hover:bg-[var(--color-accent-warm)] disabled:opacity-50"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
