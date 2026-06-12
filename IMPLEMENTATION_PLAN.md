# Implementation Plan — Purchase Modes, Variant Attributes & Checkout Separation

A phased build spec for **Claude Code**. Goal: small-ticket products (mattresses,
lights, frames, decor) are **direct online payment only**; big furniture (sofas,
beds, almirahs, dining, custom) **may** go through the WhatsApp/quote flow *or* be
paid online. Variants become attribute-driven per category (almirah → doors,
lights → color, beds → size/material). Cart and checkout make the distinction
obvious instead of offering both options for everything.

---

## How to run this with Claude Code

- One phase per session. Each phase has a goal, files it touches, acceptance
  criteria, and a ready-to-paste prompt.
- Commit after each phase. Run migrations before moving on.
- Order: 1 → 2 → 3 → 4 → 5. Phase 2 is independent of 3–4 and can be done in
  parallel if needed.

## What already exists (don't rebuild)

- `products.purchaseMode` enum `"instant" | "quote"` (default `"instant"`) and
  `priceIsIndicative` — `lib/db/schema.ts` (~line 54, 75). **Schema is done;
  nothing enforces it in the UI yet.**
- `productVariants.attributes` JSONB (`Record<string, string|number|boolean>`),
  per-variant price/stock/sku — `lib/db/schema.ts` (~line 106).
- Orders with `type: "standard" | "instant" | "quote"`, Razorpay (orders, payment
  links, webhook), quote flow with `quotedTotalInPaise`, admin quote panel.
- Cart: zustand store persisted to localStorage — `features/cart/store.ts`,
  `features/cart/types.ts` (`CartItem` has no purchase-mode field yet).
- Checkout: `app/checkout/page.tsx` (~760 lines) — shows **both** "Order via
  WhatsApp" and "Pay online now" (~line 687–692) for every cart.
- `/api/orders/instant` **rejects** any cart containing a `quote`-mode product
  (route.ts line 86–94). This must change (Phase 4).
- Product page CTA block with "Ask on WhatsApp" —
  `features/products/components/product-gallery.tsx` (~line 292–297).
- Admin: `product-form.tsx`, `variant-manager.tsx`, CSV import
  (`features/admin/import/*`).

## Semantics (apply everywhere)

| `purchaseMode` | Meaning | Checkout options |
|---|---|---|
| `instant` | Small-ticket, fixed price | **Pay online only** |
| `quote` | Big-ticket, team confirms price/delivery | **Pay online OR Order via WhatsApp** |

- `priceIsIndicative: true` (only meaningful on `quote` products) disables the
  online-payment path for that item — price must be confirmed by the team first.
- A **mixed cart** (instant + quote items): the WhatsApp option is shown **only
  when every item in the cart is `quote` mode**. Otherwise the cart is
  online-payment only. (Order splitting is out of scope — revisit if it becomes
  a real complaint.)

---

## Phase 1 — Classify products + admin control over purchase mode

**Goal:** every product has the *right* `purchaseMode`, and the admin can manage
it without touching the DB.

### Work

1. **Backfill script** `scripts/backfill-purchase-mode.ts`:
   - `quote`: sofa, bed, almirah, dining, dressing, sideboard, room_set, custom
     (also set `priceIsIndicative = true` for room_set + custom).
   - `instant`: mattress, frame, decor, lamp, ceiling_light, coffee_table, chair,
     table (adjust list with the owner before running).
2. **Admin product form** (`features/admin/components/product-form.tsx`): add a
   "Purchase mode" radio (Direct payment / Quote via team) + a
   "Price is indicative" toggle that only renders when mode = quote. Persist via
   the existing product create/update action.
3. **Products list** (`app/admin/(dashboard)/products/page.tsx`): show a mode
   badge column (e.g. ⚡ Direct / 💬 Quote) so misclassified products are visible
   at a glance.
4. **CSV import** (`features/admin/import/spec.ts` + `importers.ts`): accept
   `purchase_mode` and `price_is_indicative` columns.

### Acceptance criteria

- [ ] Backfill script run; spot-check: a mattress is `instant`, a sofa is `quote`.
- [ ] Admin can flip a product's mode from the product form and it persists.
- [ ] Products table shows the mode badge; CSV import round-trips the columns.

**▶ Claude Code prompt**
> Implement Phase 1 of IMPLEMENTATION_PLAN.md: write the purchase-mode backfill
> script, add purchase mode + indicative-price controls to the admin product form,
> a mode badge column on /admin/products, and purchase_mode /
> price_is_indicative columns in the CSV import. Show me the backfill category
> mapping before running it.

---

## Phase 2 — Attribute-driven variants per category

**Goal:** variants are defined by structured attributes that differ per category
(almirah → doors; lights → color; bed → size + material), controlled from the
admin, and rendered as proper pickers on the product page.

### New table

```ts
export const variantAttributeInputEnum = pgEnum("variant_attribute_input", [
  "select",   // dropdown / chip group: doors, size, seater
  "color",    // swatch picker: colour values are hex or names
  "text",     // free text shown as-is
]);

export const categoryVariantAttributes = pgTable("category_variant_attributes", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: productCategoryEnum("category").notNull(),
  key: text("key").notNull(),            // "doors" | "color" | "size" | "material" …
  label: text("label").notNull(),        // "Doors", "Colour", "Size"
  inputType: variantAttributeInputEnum("input_type").notNull().default("select"),
  options: jsonb("options").$type<string[]>().notNull().default([]), // allowed values for select/color
  isRequired: boolean("is_required").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [uniqueIndex("cva_category_key_idx").on(t.category, t.key)]);
```

Variants keep storing values in the existing `attributes` JSONB — this table only
*defines* which keys/values are valid per category. No variant data migration.

### Seed (adjust with owner)

- almirah: doors(select: 2 Door, 3 Door, 4 Door), material(select: Teak, Sheesham, Engineered Wood)
- bed: size(select: Single, Queen, King), material(select)
- sofa: seater(select: 1, 2, 3, L-Shape), fabric(select)
- lamp / ceiling_light: color(color), …
- mattress: size(select), thickness(select)
- dining: seater(select: 4, 6, 8)

### Work

1. Migration + seed script for `categoryVariantAttributes`.
2. **Admin — attribute definitions UI**: a "Variant attributes" section on
   `/admin/category-tree` (or a new `/admin/variant-attributes` page) to CRUD
   keys/labels/options per category.
3. **Admin — variant manager** (`features/admin/components/variant-manager.tsx`):
   - Replace free-form attribute entry with fields generated from the category's
     definitions (dropdowns for `select`, swatch input for `color`).
   - "Generate combinations" helper: pick option subsets per attribute → creates
     the cartesian product as draft variants (name auto-composed, e.g.
     "3 Door · Teak"), each with editable price/SKU/stock.
   - Validate: no two variants with identical attribute combos.
4. **Product page** (`features/products/components/product-gallery.tsx`):
   - Replace the flat variant list with one picker group per defined attribute
     (chips for select, swatches for color).
   - Selection resolution: chosen combo → matching variant (price, stock,
     images). Unavailable combos are disabled, not hidden.
   - Products with no definitions for their category fall back to the current
     flat variant-name picker (zero regression).

### Acceptance criteria

- [ ] Defs seeded; admin can edit options per category.
- [ ] Variant manager renders category-appropriate fields; combination generator
      works; duplicate combos rejected.
- [ ] PDP shows "Doors" chips for an almirah, colour swatches for a lamp, and
      size+material pickers for a bed; picking a combo switches price/images.
- [ ] Products without defs behave exactly as today.

**▶ Claude Code prompt**
> Implement Phase 2 of IMPLEMENTATION_PLAN.md: the categoryVariantAttributes
> table + seed, the admin attribute-definitions UI, the attribute-driven variant
> manager with a combination generator, and the attribute-based variant pickers
> on the product page with graceful fallback for categories without definitions.

---

## Phase 3 — Product page & cart clarity

**Goal:** one clear CTA on the product page; the cart tells the user what kind of
items they hold without confusing them.

### Work

1. **Product page** (`features/products/components/product-gallery.tsx`):
   - **Remove "Ask on WhatsApp"** (line ~292–297) for all products.
   - `instant` products: "Add to cart" (+ optional "Buy now" → cart + straight to
     checkout).
   - `quote` products: same "Add to cart", plus a small note under the price:
     *"Final price & delivery confirmed by our team"* when `priceIsIndicative`.
2. **Cart model** (`features/cart/types.ts`, `store.ts`):
   - Add `purchaseMode: "instant" | "quote"` and `priceIsIndicative: boolean` to
     `CartItem`; set them in `add-to-cart-button.tsx` / wherever items are added.
   - **localStorage migration**: bump the persist version; on rehydrate, items
     missing `purchaseMode` are refreshed from `/api` (or the cart is cleared —
     cheaper and acceptable pre-launch; pick one and note it in the PR).
3. **Cart drawer** (`features/cart/components/cart-drawer.tsx`):
   - Quote items get a subtle chip ("Quote item — price confirmed by team").
   - If the cart is mixed, a one-line banner: *"Some items need a team quote.
     You can pay online for everything, or order quote items separately via
     WhatsApp."* — no buttons here, checkout handles the rest.

### Acceptance criteria

- [ ] "Ask on WhatsApp" is gone from every product page.
- [ ] Old persisted carts don't crash; items end up with a valid `purchaseMode`.
- [ ] Quote items are visually marked in the drawer; instant-only carts show no
      quote messaging at all.

**▶ Claude Code prompt**
> Implement Phase 3 of IMPLEMENTATION_PLAN.md: remove the Ask-on-WhatsApp CTA
> from the product page, add purchaseMode/priceIsIndicative to CartItem with a
> persist-version migration, and add quote-item chips + the mixed-cart banner to
> the cart drawer.

---

## Phase 4 — Checkout separation + API enforcement

**Goal:** the checkout offers exactly the options the cart composition allows,
and the APIs enforce the same rules server-side (never trust the client).

### Decision table (single source of truth — implement as a pure function)

```
lib/commerce/checkout-options.ts
getCheckoutOptions(items): { onlinePayment: boolean; whatsappOrder: boolean; reason?: string }
```

| Cart composition | Pay online | Order via WhatsApp |
|---|---|---|
| all `instant` | ✅ | ❌ |
| all `quote`, none indicative | ✅ | ✅ |
| all `quote`, ≥1 indicative | ❌ (blocked: price not final) | ✅ |
| mixed instant + quote, none indicative | ✅ | ❌ |
| mixed, ≥1 indicative | ❌ | ❌ → show "remove indicative items to pay online, or order them separately via WhatsApp" |

### Work

1. Implement `getCheckoutOptions` + unit-style assertions (plain script or vitest
   if test setup lands first).
2. **Checkout page** (`app/checkout/page.tsx`, options block ~line 687):
   - Render only the allowed options from `getCheckoutOptions`; when only one is
     allowed, render it as the single primary button (no choice UI at all).
   - Blocked states render the explanatory reason instead of a disabled button
     mystery.
3. **API enforcement**:
   - `/api/orders/instant/route.ts`: **replace** the current "reject all quote
     products" guard (line 86–94) with: reject only when any item's product has
     `priceIsIndicative = true`. Quote-mode products with firm prices are payable
     online.
   - `/api/orders/route.ts` (WhatsApp/standard flow): reject carts containing any
     `instant` product — mirror of the table above.
   - Both return a typed error listing the offending product names (the checkout
     surfaces it).

### Acceptance criteria

- [ ] All five decision-table rows verified manually (and by the assertion
      script) against both the UI and the two APIs.
- [ ] A cart of mattress + lamp shows ONLY "Pay online now".
- [ ] A cart of one sofa (quote, firm price) shows both options.
- [ ] A custom room set (indicative) cannot reach Razorpay even via crafted
      request to `/api/orders/instant`.

**▶ Claude Code prompt**
> Implement Phase 4 of IMPLEMENTATION_PLAN.md: lib/commerce/checkout-options.ts
> with the decision table, checkout page rendering only allowed options, and
> server-side enforcement in /api/orders/instant (replace the blanket quote
> rejection with an indicative-price rejection) and /api/orders (reject instant
> items in WhatsApp orders). Typed errors must name the offending products.

---

## Phase 5 — Hardening: tests + polish

**Goal:** the money-touching logic finally gets tests; UX leftovers are cleaned up.

### Work

1. Add **vitest** (none exists today): `pnpm add -D vitest`, a `test` script.
2. Tests for:
   - `lib/commerce/pricing.ts` — 0%/12%/18% GST, multi-line rounding, discounts.
   - `lib/commerce/status.ts` — legal + illegal transitions for both flows.
   - `lib/commerce/checkout-options.ts` — all five decision-table rows.
3. Polish:
   - Order confirmation + admin order detail show the order's mode clearly.
   - Quote-flow copy on checkout explains what happens next (team contacts you
     on WhatsApp, payment link follows).

### Acceptance criteria

- [ ] `pnpm test` green in CI/local.
- [ ] Checkout copy reviewed on mobile viewport (most customers are on phones).

**▶ Claude Code prompt**
> Implement Phase 5 of IMPLEMENTATION_PLAN.md: set up vitest, write the pricing,
> status-transition, and checkout-options tests, and polish the order
> confirmation + admin order detail to surface the order mode.

---

## Out of scope (intentionally, for later)

- Splitting a mixed cart into two orders (one paid, one quote).
- Inventory gating at checkout (stock exists on variants; not enforced).
- GST invoice PDFs / CGST-SGST split.
- WhatsApp Business API auto-send (manual wa.me links stay).
- Customer accounts beyond the existing Neon Auth `users` link.

## Suggested order of attack

Phase 1 is a prerequisite for 3–4 (everything keys off `purchaseMode`). Phase 2
is the biggest chunk and independent — schedule it whenever. Do 3 and 4 back to
back so the cart and checkout never disagree. Phase 5 before any real marketing
push.
