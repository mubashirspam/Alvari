"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/features/admin/components/image-upload-field";
import type { Category } from "@/features/categories/types";
import { updateCategoryAction } from "@/app/admin/(dashboard)/categories/actions";

export function CategoryRowForm({ category }: { category: Category }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function handleSubmit(fd: FormData) {
    setStatus("idle");
    startTransition(async () => {
      try {
        await updateCategoryAction(category.category, fd);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="grid grid-cols-1 items-start gap-3 rounded-xl border border-[var(--color-line)] p-4 md:grid-cols-[180px_1fr_1fr_100px_auto]"
    >
      <ImageUploadField
        name="imageKey"
        folder="categories"
        label="Image"
        defaultValue={category.imageKey ?? ""}
        aspectClass="aspect-square"
      />

      <div>
        <label className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Label
        </label>
        <Input name="label" required defaultValue={category.label} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Slug
        </label>
        <Input name="slug" required defaultValue={category.slug} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Sort
        </label>
        <Input name="sortOrder" type="number" defaultValue={category.sortOrder} />
      </div>

      <div className="flex flex-col gap-2 md:items-end">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={category.isVisible}
            className="h-4 w-4"
          />
          Visible
        </label>
        <input
          type="hidden"
          name="subtitle"
          value={category.subtitle ?? ""}
        />
        <input
          type="hidden"
          name="heroImageKey"
          value={category.heroImageKey ?? ""}
        />
        <input
          type="hidden"
          name="accentColor"
          value={category.accentColor ?? ""}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-xs text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-50"
        >
          {pending ? "…" : status === "saved" ? "Saved ✓" : "Save"}
        </button>
        {status === "error" ? (
          <span className="text-[10px] text-red-700">Save failed</span>
        ) : null}
      </div>
    </form>
  );
}
