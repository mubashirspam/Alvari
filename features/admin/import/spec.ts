/**
 * Single source of truth for the CSV bulk-import system.
 * Column specs drive: template generation, validation errors, and the
 * column-reference UI in the import dialog.
 *
 * Conventions (documented in docs/CSV_IMPORT.md):
 *  - Prices are in INR rupees (e.g. 45999 or 45,999) — converted to paise.
 *  - Booleans accept true/false, yes/no, 1/0 (case-insensitive).
 *  - Multi-value cells (image_keys, product_slugs, tags) are pipe-separated.
 *  - Variant attributes: `key:value|key:value` (e.g. Size:Queen|Wood:Teak).
 *  - Dates are ISO format: 2026-06-15 or 2026-06-15T10:00:00+05:30.
 */

export const IMPORT_ENTITIES = [
  "products",
  "variants",
  "categories",
  "banners",
  "collections",
] as const;

export type ImportEntity = (typeof IMPORT_ENTITIES)[number];

export function isImportEntity(value: string): value is ImportEntity {
  return (IMPORT_ENTITIES as readonly string[]).includes(value);
}

export type ColumnSpec = {
  key: string;
  required: boolean;
  description: string;
  example: string;
};

export type EntitySpec = {
  entity: ImportEntity;
  label: string;
  /** Column used to decide create vs update. */
  upsertKey: string;
  columns: ColumnSpec[];
};

const PRODUCT_CATEGORIES =
  "almirah | bed | sofa | dining | dressing | coffee_table | mattress | room_set | custom | chair | sideboard | table";

export const IMPORT_SPECS: Record<ImportEntity, EntitySpec> = {
  products: {
    entity: "products",
    label: "Products",
    upsertKey: "slug",
    columns: [
      { key: "slug", required: true, description: "Unique URL slug (kebab-case). Existing slug = update, new slug = create.", example: "teak-wood-queen-bed" },
      { key: "name", required: true, description: "Display name", example: "Teak Wood Queen Bed" },
      { key: "category", required: true, description: `One of: ${PRODUCT_CATEGORIES}`, example: "bed" },
      { key: "meta", required: true, description: "Short tagline shown on cards", example: "Solid teak · queen size" },
      { key: "description", required: true, description: "Short description", example: "Handcrafted queen bed in seasoned teak." },
      { key: "long_description", required: false, description: "Full description (markdown allowed)", example: "Built from seasoned Wayanad teak…" },
      { key: "brand", required: false, description: "Brand name (default: Alvari)", example: "Alvari" },
      { key: "material", required: false, description: "Primary material", example: "Teak wood" },
      { key: "warranty_months", required: false, description: "Warranty in months (default: 12)", example: "24" },
      { key: "care_instructions", required: false, description: "Care notes", example: "Wipe with dry cloth" },
      { key: "dimensions", required: false, description: "Dimensions text", example: "78in x 60in x 48in" },
      { key: "weight_kg", required: false, description: "Weight in kg (decimal)", example: "85.5" },
      { key: "price_now_inr", required: true, description: "Selling price in rupees", example: "45999" },
      { key: "price_was_inr", required: true, description: "MRP / strike-through price in rupees", example: "62000" },
      { key: "badge", required: false, description: "One of: bestseller | new | trending | value_pick | best_value (or empty)", example: "bestseller" },
      { key: "purchase_mode", required: false, description: "instant (pay online) or quote (admin quotes final price). Default: instant", example: "instant" },
      { key: "price_is_indicative", required: false, description: "true/false — price shown is a starting point (default: false)", example: "false" },
      { key: "hsn_code", required: false, description: "HSN code for GST invoicing", example: "9403" },
      { key: "gst_rate", required: false, description: "GST percent, e.g. 18 or 18.00 (empty = no tax computed)", example: "18" },
      { key: "meta_title", required: false, description: "SEO <title> override (~60 chars)", example: "Teak Queen Bed – Solid Wood | Alvari Kerala" },
      { key: "meta_description", required: false, description: "SEO meta description override (~160 chars)", example: "Handcrafted teak queen bed from our Wayanad workshop…" },
      { key: "illustration_key", required: false, description: "Illustration key (default: category value)", example: "bed" },
      { key: "image_keys", required: false, description: "Pipe-separated ImageKit paths. If set, replaces the product's gallery.", example: "/prod/kaasth/products/bed-1.webp|/prod/kaasth/products/bed-2.webp" },
      { key: "gradient_from", required: false, description: "Card gradient start (default: #8B5E3C)", example: "#8B5E3C" },
      { key: "gradient_to", required: false, description: "Card gradient end (default: #3E2818)", example: "#3E2818" },
      { key: "is_featured", required: false, description: "true/false (default: false)", example: "true" },
      { key: "is_active", required: false, description: "true/false (default: true)", example: "true" },
      { key: "sort_order", required: false, description: "Listing order, low first (default: 0)", example: "10" },
    ],
  },
  variants: {
    entity: "variants",
    label: "Product variants",
    upsertKey: "sku",
    columns: [
      { key: "product_slug", required: true, description: "Slug of an existing product the variant belongs to", example: "teak-wood-queen-bed" },
      { key: "sku", required: true, description: "Unique SKU. Existing SKU = update, new = create.", example: "BED-TEAK-Q-NAT" },
      { key: "name", required: true, description: "Variant display name", example: "Queen · Natural finish" },
      { key: "attributes", required: false, description: "key:value pairs separated by | (e.g. Size:Queen|Finish:Natural)", example: "Size:Queen|Finish:Natural" },
      { key: "price_now_inr", required: true, description: "Selling price in rupees", example: "45999" },
      { key: "price_was_inr", required: true, description: "MRP in rupees", example: "62000" },
      { key: "stock", required: false, description: "Units in stock (default: 0)", example: "5" },
      { key: "is_default", required: false, description: "true/false — default-selected variant (default: false)", example: "true" },
      { key: "sort_order", required: false, description: "Order within product (default: 0)", example: "0" },
    ],
  },
  categories: {
    entity: "categories",
    label: "Categories",
    upsertKey: "category",
    columns: [
      { key: "category", required: true, description: `One of: ${PRODUCT_CATEGORIES}. Existing = update.`, example: "bed" },
      { key: "label", required: true, description: "Display label", example: "Beds" },
      { key: "slug", required: true, description: "Unique URL slug", example: "beds" },
      { key: "subtitle", required: false, description: "Short subtitle", example: "Solid wood beds in all sizes" },
      { key: "image_key", required: false, description: "ImageKit path for the tile image", example: "/prod/kaasth/categories/beds.webp" },
      { key: "hero_image_key", required: false, description: "ImageKit path for the category hero", example: "/prod/kaasth/categories/beds-hero.webp" },
      { key: "accent_color", required: false, description: "Hex accent color", example: "#8B5E3C" },
      { key: "sort_order", required: false, description: "Order, low first (default: 0)", example: "2" },
      { key: "is_visible", required: false, description: "true/false (default: true)", example: "true" },
    ],
  },
  banners: {
    entity: "banners",
    label: "Banners",
    upsertKey: "slug",
    columns: [
      { key: "slug", required: true, description: "Unique slug. Existing = update, new = create.", example: "monsoon-sale-hero" },
      { key: "slot", required: true, description: "One of: hero | secondary | promo_strip | mid_page | collection_tile | category_tile", example: "hero" },
      { key: "title", required: false, description: "Headline", example: "Monsoon Sale" },
      { key: "subtitle", required: false, description: "Supporting line", example: "Up to 40% off solid-wood furniture" },
      { key: "overline", required: false, description: "Small text above the title", example: "LIMITED TIME" },
      { key: "cta_label", required: false, description: "Button label", example: "Shop the sale" },
      { key: "cta_url", required: false, description: "Button link", example: "/products?sale=true" },
      { key: "image_key", required: true, description: "ImageKit path for the banner image", example: "/prod/kaasth/banners/monsoon.webp" },
      { key: "mobile_image_key", required: false, description: "ImageKit path for the mobile image", example: "/prod/kaasth/banners/monsoon-m.webp" },
      { key: "bg_color", required: false, description: "Hex background color", example: "#1A1A14" },
      { key: "text_color", required: false, description: "Hex text color", example: "#FFFFFF" },
      { key: "starts_at", required: false, description: "ISO date the banner goes live", example: "2026-06-15" },
      { key: "ends_at", required: false, description: "ISO date the banner expires", example: "2026-07-15" },
      { key: "sort_order", required: false, description: "Order within slot (default: 0)", example: "0" },
      { key: "is_active", required: false, description: "true/false (default: true)", example: "true" },
    ],
  },
  collections: {
    entity: "collections",
    label: "Collections",
    upsertKey: "slug",
    columns: [
      { key: "slug", required: true, description: "Unique slug. Existing = update, new = create.", example: "bedroom-essentials" },
      { key: "title", required: true, description: "Collection title", example: "Bedroom Essentials" },
      { key: "subtitle", required: false, description: "Short subtitle", example: "Everything for a calm bedroom" },
      { key: "description", required: false, description: "Longer description", example: "Beds, wardrobes and dressers that pair well." },
      { key: "hero_image_key", required: false, description: "ImageKit path for the hero image", example: "/prod/kaasth/collections/bedroom.webp" },
      { key: "accent_color", required: false, description: "Hex accent color", example: "#3E2818" },
      { key: "product_slugs", required: false, description: "Pipe-separated product slugs. If set, replaces the collection's products.", example: "teak-wood-queen-bed|teak-almirah-3-door" },
      { key: "sort_order", required: false, description: "Order, low first (default: 0)", example: "1" },
      { key: "is_featured", required: false, description: "true/false (default: false)", example: "true" },
      { key: "is_active", required: false, description: "true/false (default: true)", example: "true" },
    ],
  },
};

/** Header row + one realistic example row, ready to download as a template. */
export function templateRows(entity: ImportEntity): string[][] {
  const spec = IMPORT_SPECS[entity];
  return [
    spec.columns.map((c) => c.key),
    spec.columns.map((c) => c.example),
  ];
}
