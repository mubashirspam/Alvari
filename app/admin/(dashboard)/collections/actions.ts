"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createCollection,
  deleteCollection,
  setCollectionProducts,
  updateCollection,
} from "@/features/collections/services/collection-service";
import { requireAdmin } from "@/lib/auth/session";

const Schema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  heroImageKey: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function parseForm(fd: FormData) {
  return Schema.parse({
    slug: fd.get("slug"),
    title: fd.get("title"),
    subtitle: emptyToNull(fd.get("subtitle")),
    description: emptyToNull(fd.get("description")),
    heroImageKey: emptyToNull(fd.get("heroImageKey")),
    accentColor: emptyToNull(fd.get("accentColor")),
    sortOrder: fd.get("sortOrder") ?? 0,
    isFeatured: fd.get("isFeatured") === "on",
    isActive: fd.get("isActive") === "on",
  });
}

export async function createCollectionAction(fd: FormData) {
  await requireAdmin();
  const data = parseForm(fd);
  const created = await createCollection(data);
  revalidatePath("/admin/collections");
  revalidatePath("/");
  redirect(`/admin/collections/${created.id}`);
}

export async function updateCollectionAction(id: string, fd: FormData) {
  await requireAdmin();
  const data = parseForm(fd);
  await updateCollection(id, data);
  revalidatePath("/admin/collections");
  revalidatePath("/");
}

export async function deleteCollectionAction(id: string) {
  await requireAdmin();
  await deleteCollection(id);
  revalidatePath("/admin/collections");
  revalidatePath("/");
}

export async function setCollectionProductsAction(
  id: string,
  productIds: string[],
) {
  await requireAdmin();
  await setCollectionProducts(id, productIds);
  revalidatePath("/admin/collections");
  revalidatePath(`/admin/collections/${id}`);
  revalidatePath("/");
}
