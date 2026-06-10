# CSV bulk import

Import Products, Product Variants, Categories, Banners and Collections from
Excel/Google Sheets via CSV. Every import surface lives in the admin panel:

| Entity | Where | Button |
|---|---|---|
| Products | `/admin/products` | **Import products** |
| Product variants | `/admin/products` | **Import variants** |
| Categories | `/admin/categories` | **Import CSV** |
| Banners | `/admin/banners` | **Import CSV** |
| Collections | `/admin/collections` | **Import CSV** |

Each dialog has a **Download CSV template** link (header row + one example
row) and a built-in column reference.

## How it works

- **Excel → CSV**: build your sheet in Excel/Google Sheets, then *File → Save
  As → CSV UTF-8*. Upload that file.
- **Upsert semantics**: each entity has a key column (see below). If a row's
  key already exists the record is **updated**; otherwise it's **created**.
  Re-importing the same file is safe (idempotent).
- **Live progress**: the server streams progress row-by-row — the dialog shows
  a progress bar, created/updated/failed counters and a per-row log.
- **Partial success**: rows are independent. A failed row never blocks the
  rest; fix the reported rows and re-import only those.
- **Limits**: 5 MB / 5 000 rows per file. Admin login required.

## Value conventions

| Type | Format |
|---|---|
| Prices | INR **rupees**: `45999`, `45,999`, `₹45999.50` → stored as paise |
| Booleans | `true`/`false`, `yes`/`no`, `1`/`0` (blank = default) |
| Lists | pipe-separated: `a\|b\|c` (`image_keys`, `product_slugs`) |
| Variant attributes | `key:value` pairs piped: `Size:Queen\|Finish:Natural` |
| Dates | ISO: `2026-06-15` or `2026-06-15T10:00:00+05:30` |
| Image keys | ImageKit file paths, e.g. `/prod/kaasth/products/bed-1.webp` |

Blank optional cells keep the documented default on create and are written as
empty/default on update (the importer writes full rows, not patches).

## products.csv — upsert by `slug`

| Column | Required | Notes |
|---|---|---|
| `slug` | ✅ | unique kebab-case, e.g. `teak-wood-queen-bed` |
| `name` | ✅ | display name |
| `category` | ✅ | `almirah \| bed \| sofa \| dining \| dressing \| coffee_table \| mattress \| room_set \| custom \| chair \| sideboard \| table` |
| `meta` | ✅ | short tagline on cards |
| `description` | ✅ | short description |
| `long_description` | — | full text/markdown |
| `brand` | — | default `Alvari` |
| `material` | — | e.g. `Teak wood` |
| `warranty_months` | — | integer, default `12` |
| `care_instructions` | — | |
| `dimensions` | — | free text, e.g. `78in x 60in x 48in` |
| `weight_kg` | — | decimal |
| `price_now_inr` | ✅ | selling price in rupees |
| `price_was_inr` | ✅ | MRP in rupees |
| `badge` | — | `bestseller \| new \| trending \| value_pick \| best_value` |
| `purchase_mode` | — | `instant` (pay online) or `quote` (admin quotes the final price); default `instant` |
| `price_is_indicative` | — | `true` when the price is a starting point; default `false` |
| `hsn_code` | — | HSN code for GST invoicing, e.g. `9403` |
| `gst_rate` | — | GST percent, e.g. `18` (empty = no tax computed) |
| `meta_title` | — | SEO title override (~60 chars) |
| `meta_description` | — | SEO meta description override (~160 chars) |
| `illustration_key` | — | default: the category value |
| `image_keys` | — | piped ImageKit paths; **if set, replaces the gallery** |
| `gradient_from` | — | default `#8B5E3C` |
| `gradient_to` | — | default `#3E2818` |
| `is_featured` | — | default `false` |
| `is_active` | — | default `true` |
| `sort_order` | — | integer, default `0` |

## variants.csv — upsert by `sku`

| Column | Required | Notes |
|---|---|---|
| `product_slug` | ✅ | must reference an existing product (import products first) |
| `sku` | ✅ | unique, e.g. `BED-TEAK-Q-NAT` |
| `name` | ✅ | e.g. `Queen · Natural finish` |
| `attributes` | — | `Size:Queen\|Finish:Natural` |
| `price_now_inr` | ✅ | rupees |
| `price_was_inr` | ✅ | rupees |
| `stock` | — | integer, default `0` |
| `is_default` | — | `true` marks the default variant (auto-unsets siblings) |
| `sort_order` | — | integer, default `0` |

## categories.csv — upsert by `category`

Categories are fixed to the product enum — this import edits their
presentation, it cannot invent new enum values.

| Column | Required | Notes |
|---|---|---|
| `category` | ✅ | enum value (see products) |
| `label` | ✅ | display label, e.g. `Beds` |
| `slug` | ✅ | unique |
| `subtitle` | — | |
| `image_key` | — | tile image |
| `hero_image_key` | — | category hero |
| `accent_color` | — | hex |
| `sort_order` | — | default `0` |
| `is_visible` | — | default `true` |

## banners.csv — upsert by `slug`

| Column | Required | Notes |
|---|---|---|
| `slug` | ✅ | unique |
| `slot` | ✅ | `hero \| secondary \| promo_strip \| mid_page \| collection_tile \| category_tile` |
| `title` / `subtitle` / `overline` | — | copy |
| `cta_label` / `cta_url` | — | button |
| `image_key` | ✅ | desktop image |
| `mobile_image_key` | — | mobile image |
| `bg_color` / `text_color` | — | hex |
| `starts_at` / `ends_at` | — | ISO dates (schedule) |
| `sort_order` | — | default `0` |
| `is_active` | — | default `true` |

## collections.csv — upsert by `slug`

| Column | Required | Notes |
|---|---|---|
| `slug` | ✅ | unique |
| `title` | ✅ | |
| `subtitle` / `description` | — | |
| `hero_image_key` | — | |
| `accent_color` | — | hex |
| `product_slugs` | — | piped slugs; **if set, replaces the collection's products** (row fails if any slug doesn't exist) |
| `sort_order` | — | default `0` |
| `is_featured` | — | default `false` |
| `is_active` | — | default `true` |

## API

- `POST /api/admin/import/{entity}` — multipart `file`; streams NDJSON events:
  `{type:"start",total}` → `{type:"row",index,status,label,message?}` … →
  `{type:"done",created,updated,failed}`.
- `GET /api/admin/import/{entity}/template` — CSV template download.

`{entity}` ∈ `products | variants | categories | banners | collections`.
Source of truth for columns: `features/admin/import/spec.ts`.
