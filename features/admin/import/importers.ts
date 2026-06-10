import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  banners,
  bannerSlotEnum,
  categories,
  collectionProducts,
  collections,
  productBadgeEnum,
  productCategoryEnum,
  productImages,
  products,
  productVariants,
  type NewBannerRow,
  type NewCategoryRow,
  type NewCollectionRow,
  type NewProductRow,
  type NewProductVariantRow,
  type VariantAttributes,
} from "@/lib/db/schema";
import type { ImportEntity } from "./spec";

/** Validation/persistence failure for a single CSV row. */
export class ImportRowError extends Error {}

export type RowResult = {
  status: "created" | "updated";
  label: string;
};

/** Per-run caches so repeated lookups (product slugs) hit the DB once. */
export type ImportContext = {
  productIdBySlug: Map<string, string>;
};

export function createImportContext(): ImportContext {
  return { productIdBySlug: new Map() };
}

/* ── field parsing helpers ─────────────────────────────────────────────── */

function fail(errors: string[]): never {
  throw new ImportRowError(errors.join("; "));
}

function parseBool(value: string, fallback: boolean): boolean {
  const v = value.trim().toLowerCase();
  if (v === "") return fallback;
  if (["true", "yes", "y", "1"].includes(v)) return true;
  if (["false", "no", "n", "0"].includes(v)) return false;
  throw new ImportRowError(`invalid boolean "${value}" (use true/false)`);
}

function parseIntField(value: string, field: string, fallback: number): number {
  const v = value.trim();
  if (v === "") return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) {
    throw new ImportRowError(`${field}: "${value}" is not a non-negative integer`);
  }
  return n;
}

/** "45,999" / "₹45999.50" → paise. */
function rupeesToPaise(value: string, field: string): number {
  const cleaned = value.replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  if (cleaned === "" || !Number.isFinite(n) || n < 0) {
    throw new ImportRowError(`${field}: "${value}" is not a valid rupee amount`);
  }
  return Math.round(n * 100);
}

function parseDateField(value: string, field: string): Date | null {
  const v = value.trim();
  if (v === "") return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw new ImportRowError(`${field}: "${value}" is not a valid ISO date`);
  }
  return d;
}

function pipeList(value: string): string[] {
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "Size:Queen|Finish:Natural" → { Size: "Queen", Finish: "Natural" }. */
function parseAttributes(value: string): VariantAttributes {
  const v = value.trim();
  if (v === "") return {};
  const attrs: VariantAttributes = {};
  for (const pair of pipeList(v)) {
    const idx = pair.indexOf(":");
    if (idx <= 0) {
      throw new ImportRowError(
        `attributes: "${pair}" must be key:value (pairs separated by |)`,
      );
    }
    attrs[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return attrs;
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function requireFields(
  record: Record<string, string>,
  keys: string[],
): string[] {
  return keys
    .filter((k) => !(record[k] ?? "").trim())
    .map((k) => `missing required column "${k}"`);
}

function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  field: string,
): T {
  const v = value.trim().toLowerCase() as T;
  if (!allowed.includes(v)) {
    throw new ImportRowError(
      `${field}: "${value}" must be one of: ${allowed.join(" | ")}`,
    );
  }
  return v;
}

async function resolveProductId(
  slug: string,
  ctx: ImportContext,
): Promise<string | null> {
  const cached = ctx.productIdBySlug.get(slug);
  if (cached) return cached;
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (!rows[0]) return null;
  ctx.productIdBySlug.set(slug, rows[0].id);
  return rows[0].id;
}

/* ── per-entity importers ──────────────────────────────────────────────── */

async function importProductRow(
  record: Record<string, string>,
  ctx: ImportContext,
): Promise<RowResult> {
  const errors = requireFields(record, [
    "slug",
    "name",
    "category",
    "meta",
    "description",
    "price_now_inr",
    "price_was_inr",
  ]);
  if (errors.length) fail(errors);

  const slug = normalizeSlug(record.slug);
  const category = oneOf(record.category, productCategoryEnum.enumValues, "category");
  const badgeRaw = (record.badge ?? "").trim();
  const badge = badgeRaw
    ? oneOf(badgeRaw, productBadgeEnum.enumValues, "badge")
    : null;
  const weightRaw = (record.weight_kg ?? "").trim();
  if (weightRaw && !Number.isFinite(Number(weightRaw))) {
    fail([`weight_kg: "${weightRaw}" is not a number`]);
  }

  const values: NewProductRow = {
    slug,
    name: record.name.trim(),
    category,
    meta: record.meta.trim(),
    description: record.description.trim(),
    longDescription: (record.long_description ?? "").trim() || null,
    brand: (record.brand ?? "").trim() || "Alvari",
    material: (record.material ?? "").trim() || null,
    warrantyMonths: parseIntField(record.warranty_months ?? "", "warranty_months", 12),
    careInstructions: (record.care_instructions ?? "").trim() || null,
    dimensions: (record.dimensions ?? "").trim() || null,
    weightKg: weightRaw || null,
    priceNowInPaise: rupeesToPaise(record.price_now_inr, "price_now_inr"),
    priceWasInPaise: rupeesToPaise(record.price_was_inr, "price_was_inr"),
    badge,
    illustrationKey: (record.illustration_key ?? "").trim() || category,
    gradientFrom: (record.gradient_from ?? "").trim() || "#8B5E3C",
    gradientTo: (record.gradient_to ?? "").trim() || "#3E2818",
    isFeatured: parseBool(record.is_featured ?? "", false),
    isActive: parseBool(record.is_active ?? "", true),
    sortOrder: parseIntField(record.sort_order ?? "", "sort_order", 0),
  };

  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  let productId: string;
  let status: RowResult["status"];
  if (existing[0]) {
    await db
      .update(products)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(products.id, existing[0].id));
    productId = existing[0].id;
    status = "updated";
  } else {
    const [row] = await db.insert(products).values(values).returning({ id: products.id });
    productId = row.id;
    status = "created";
  }
  ctx.productIdBySlug.set(slug, productId);

  const imageKeys = pipeList(record.image_keys ?? "");
  if (imageKeys.length > 0) {
    await db
      .delete(productImages)
      .where(and(eq(productImages.productId, productId), isNull(productImages.variantId)));
    await db.insert(productImages).values(
      imageKeys.map((imageKey, i) => ({
        productId,
        imageKey,
        alt: values.name,
        sortOrder: i,
      })),
    );
  }

  return { status, label: slug };
}

async function importVariantRow(
  record: Record<string, string>,
  ctx: ImportContext,
): Promise<RowResult> {
  const errors = requireFields(record, [
    "product_slug",
    "sku",
    "name",
    "price_now_inr",
    "price_was_inr",
  ]);
  if (errors.length) fail(errors);

  const productSlug = normalizeSlug(record.product_slug);
  const productId = await resolveProductId(productSlug, ctx);
  if (!productId) {
    fail([`product_slug: no product found with slug "${productSlug}" — import the product first`]);
  }

  const sku = record.sku.trim();
  const values: NewProductVariantRow = {
    productId,
    sku,
    name: record.name.trim(),
    attributes: parseAttributes(record.attributes ?? ""),
    priceNowInPaise: rupeesToPaise(record.price_now_inr, "price_now_inr"),
    priceWasInPaise: rupeesToPaise(record.price_was_inr, "price_was_inr"),
    stock: parseIntField(record.stock ?? "", "stock", 0),
    isDefault: parseBool(record.is_default ?? "", false),
    sortOrder: parseIntField(record.sort_order ?? "", "sort_order", 0),
  };

  const existing = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.sku, sku))
    .limit(1);

  let variantId: string;
  let status: RowResult["status"];
  if (existing[0]) {
    await db.update(productVariants).set(values).where(eq(productVariants.id, existing[0].id));
    variantId = existing[0].id;
    status = "updated";
  } else {
    const [row] = await db
      .insert(productVariants)
      .values(values)
      .returning({ id: productVariants.id });
    variantId = row.id;
    status = "created";
  }

  // Keep "default variant" unique per product.
  if (values.isDefault) {
    await db
      .update(productVariants)
      .set({ isDefault: false })
      .where(
        and(
          eq(productVariants.productId, productId),
          ne(productVariants.id, variantId),
        ),
      );
  }

  return { status, label: sku };
}

async function importCategoryRow(
  record: Record<string, string>,
): Promise<RowResult> {
  const errors = requireFields(record, ["category", "label", "slug"]);
  if (errors.length) fail(errors);

  const category = oneOf(record.category, productCategoryEnum.enumValues, "category");
  const values: NewCategoryRow = {
    category,
    label: record.label.trim(),
    slug: normalizeSlug(record.slug),
    subtitle: (record.subtitle ?? "").trim() || null,
    imageKey: (record.image_key ?? "").trim() || null,
    heroImageKey: (record.hero_image_key ?? "").trim() || null,
    accentColor: (record.accent_color ?? "").trim() || null,
    sortOrder: parseIntField(record.sort_order ?? "", "sort_order", 0),
    isVisible: parseBool(record.is_visible ?? "", true),
  };

  const existing = await db
    .select({ category: categories.category })
    .from(categories)
    .where(eq(categories.category, category))
    .limit(1);

  if (existing[0]) {
    await db
      .update(categories)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(categories.category, category));
    return { status: "updated", label: category };
  }
  await db.insert(categories).values(values);
  return { status: "created", label: category };
}

async function importBannerRow(
  record: Record<string, string>,
): Promise<RowResult> {
  const errors = requireFields(record, ["slug", "slot", "image_key"]);
  if (errors.length) fail(errors);

  const slug = normalizeSlug(record.slug);
  const values: NewBannerRow = {
    slug,
    slot: oneOf(record.slot, bannerSlotEnum.enumValues, "slot"),
    title: (record.title ?? "").trim() || null,
    subtitle: (record.subtitle ?? "").trim() || null,
    overline: (record.overline ?? "").trim() || null,
    ctaLabel: (record.cta_label ?? "").trim() || null,
    ctaUrl: (record.cta_url ?? "").trim() || null,
    imageKey: record.image_key.trim(),
    mobileImageKey: (record.mobile_image_key ?? "").trim() || null,
    bgColor: (record.bg_color ?? "").trim() || null,
    textColor: (record.text_color ?? "").trim() || null,
    startsAt: parseDateField(record.starts_at ?? "", "starts_at"),
    endsAt: parseDateField(record.ends_at ?? "", "ends_at"),
    sortOrder: parseIntField(record.sort_order ?? "", "sort_order", 0),
    isActive: parseBool(record.is_active ?? "", true),
  };

  const existing = await db
    .select({ id: banners.id })
    .from(banners)
    .where(eq(banners.slug, slug))
    .limit(1);

  if (existing[0]) {
    await db
      .update(banners)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(banners.id, existing[0].id));
    return { status: "updated", label: slug };
  }
  await db.insert(banners).values(values);
  return { status: "created", label: slug };
}

async function importCollectionRow(
  record: Record<string, string>,
  ctx: ImportContext,
): Promise<RowResult> {
  const errors = requireFields(record, ["slug", "title"]);
  if (errors.length) fail(errors);

  const slug = normalizeSlug(record.slug);
  const values: NewCollectionRow = {
    slug,
    title: record.title.trim(),
    subtitle: (record.subtitle ?? "").trim() || null,
    description: (record.description ?? "").trim() || null,
    heroImageKey: (record.hero_image_key ?? "").trim() || null,
    accentColor: (record.accent_color ?? "").trim() || null,
    sortOrder: parseIntField(record.sort_order ?? "", "sort_order", 0),
    isFeatured: parseBool(record.is_featured ?? "", false),
    isActive: parseBool(record.is_active ?? "", true),
  };

  // Resolve linked products up-front so a bad slug fails the row cleanly.
  const productSlugs = pipeList(record.product_slugs ?? "").map(normalizeSlug);
  let productIds: string[] = [];
  if (productSlugs.length > 0) {
    const rows = await db
      .select({ id: products.id, slug: products.slug })
      .from(products)
      .where(inArray(products.slug, productSlugs));
    const bySlug = new Map(rows.map((r) => [r.slug, r.id]));
    const missing = productSlugs.filter((s) => !bySlug.has(s));
    if (missing.length > 0) {
      fail([`product_slugs: no product found for: ${missing.join(", ")}`]);
    }
    productIds = productSlugs.map((s) => bySlug.get(s) as string);
    for (const r of rows) ctx.productIdBySlug.set(r.slug, r.id);
  }

  const existing = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);

  let collectionId: string;
  let status: RowResult["status"];
  if (existing[0]) {
    await db
      .update(collections)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(collections.id, existing[0].id));
    collectionId = existing[0].id;
    status = "updated";
  } else {
    const [row] = await db
      .insert(collections)
      .values(values)
      .returning({ id: collections.id });
    collectionId = row.id;
    status = "created";
  }

  if (productSlugs.length > 0) {
    await db
      .delete(collectionProducts)
      .where(eq(collectionProducts.collectionId, collectionId));
    await db.insert(collectionProducts).values(
      productIds.map((productId, i) => ({
        collectionId,
        productId,
        sortOrder: i,
      })),
    );
  }

  return { status, label: slug };
}

/* ── dispatcher ────────────────────────────────────────────────────────── */

export async function importRow(
  entity: ImportEntity,
  record: Record<string, string>,
  ctx: ImportContext,
): Promise<RowResult> {
  switch (entity) {
    case "products":
      return importProductRow(record, ctx);
    case "variants":
      return importVariantRow(record, ctx);
    case "categories":
      return importCategoryRow(record);
    case "banners":
      return importBannerRow(record);
    case "collections":
      return importCollectionRow(record, ctx);
  }
}
