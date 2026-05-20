"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateCategory } from "@/features/categories/services/category-service";
import { requireAdmin } from "@/lib/auth/session";
import type { ProductCategoryValue } from "@/features/categories/types";

const Schema = z.object({
  label: z.string().min(1),
  slug: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  heroImageKey: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
});

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

export async function updateCategoryAction(
  category: ProductCategoryValue,
  fd: FormData,
) {
  await requireAdmin();
  const data = Schema.parse({
    label: fd.get("label"),
    slug: fd.get("slug"),
    subtitle: emptyToNull(fd.get("subtitle")),
    imageKey: emptyToNull(fd.get("imageKey")),
    heroImageKey: emptyToNull(fd.get("heroImageKey")),
    accentColor: emptyToNull(fd.get("accentColor")),
    sortOrder: fd.get("sortOrder") ?? 0,
    isVisible: fd.get("isVisible") === "on",
  });
  await updateCategory(category, data);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
