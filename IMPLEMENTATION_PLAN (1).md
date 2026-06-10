# Implementation Plan — Catalog + Commerce Layer

A phased build spec for **Claude Code**. Covers the schema changes and the full
order/quote/payment layer. **The scraped-data converter is out of scope** (built
elsewhere).

---

## How to run this with Claude Code

- Do **one phase per session**. Each phase has a goal, the exact schema/code to
  produce, the files it touches, acceptance criteria, and a ready-to-paste prompt.
- Commit after each phase. Run the migration step before moving on.
- Phases are ordered by dependency: 1 → 2 → 3 → 4 → 5 → 6. Don't skip ahead.
- Paste the **"▶ Claude Code prompt"** block at the start of each session, then
  let it work and review the diff.

## Stack assumptions

- Next.js 15 (App Router) on Vercel
- Drizzle ORM + Postgres (Supabase)
- Razorpay for payments (India)
- TypeScript, server-side route handlers under `app/api/**`
- Money is **integer paise** everywhere. Never use floats for money.

## Environment variables to add

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
ADMIN_EMAILS=               # comma-separated, for the admin guard
```

## Cross-cutting decisions (apply in every phase)

1. **One `orders` table, two flows**, branched by `orders.type` (`quote` | `instant`).
2. **Prices freeze on the order.** `order_items.unitPriceInPaise` is a snapshot
   taken at order creation. Never recompute from the live product later.
3. **Status is enforced in app code**, not the DB. Define allowed transitions in a
   single map and reject anything else.
4. **GST**: store `taxInPaise` on the order + a `placeOfSupplyState`. Kerala→Kerala
   is CGST+SGST (split tax in half on the invoice); other states are IGST. You only
   need the split when you build invoices — store `taxInPaise` now, add the breakdown
   columns when invoicing lands.
5. **Quote items are never charged at the indicative price.** Their order total comes
   from `quotedTotalInPaise`, which the admin sets.

---

## Phase 1 — Catalog schema: categories table + product fields

**Goal:** replace the `category` enum with a `categories` table, and add the fields
the commerce layer needs (`purchaseMode`, GST, indicative pricing, SEO).

### New table

```ts
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): any => categories.id, { onDelete: "set null" }),
  illustrationKey: text("illustration_key"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Seed (run after creating the table)

Segments (parentId = null), then types under them. Set `purchaseMode` per type later.

- **Furniture**: almirah, bed, sofa, dining, dressing, coffee_table, chair, sideboard, table, room_set, custom
- **Mattresses**: mattress
- **Home Goods**: frame, decor
- **Lighting**: ceiling_light, lamp  *(future-ready, can be inactive at launch)*

### `products` table changes

```ts
export const purchaseModeEnum = pgEnum("purchase_mode", ["quote", "instant"]);

// replace `category` enum column with:
categoryId: uuid("category_id").notNull().references(() => categories.id),

// add:
purchaseMode: purchaseModeEnum("purchase_mode").notNull().default("instant"),
priceIsIndicative: boolean("price_is_indicative").notNull().default(false),
hsnCode: text("hsn_code"),                                  // nullable until known
gstRate: numeric("gst_rate", { precision: 5, scale: 2 }),   // e.g. "18.00"; confirm rates with your CA
metaTitle: text("meta_title"),                              // SEO <title>; `meta` stays the card tagline
metaDescription: text("meta_description"),
```

> Big-ticket categories (sofa, room_set, dining, custom, full bed sets) should be
> `purchaseMode: "quote"` and `priceIsIndicative: true`. Small goods (mattress,
> frame, lamp) stay `"instant"`.

### Migration steps

1. Create `categories`, seed it.
2. Add `categoryId` as **nullable** first; backfill by matching the old enum value to
   the category slug; then make it `notNull` and drop the old `category` column + the
   `product_category` enum.
3. Add the remaining product columns.

### Acceptance criteria

- [ ] `categories` exists with parent/child rows seeded.
- [ ] Every product row has a valid `categoryId`; old enum column and type are gone.
- [ ] New product columns exist with sane defaults.
- [ ] `npm run db:generate && npm run db:migrate` (or your Drizzle scripts) run clean.

**▶ Claude Code prompt**
> Read my Drizzle schema file. Implement Phase 1 of IMPLEMENTATION_PLAN.md: add the
> `categories` table, change `products.category` (enum) to `categoryId` referencing
> categories, and add purchaseMode/priceIsIndicative/hsnCode/gstRate/metaTitle/
> metaDescription. Write a seed script for the categories listed, and a migration that
> backfills categoryId from the old enum before dropping it. Generate and show me the
> migration; don't run it until I confirm.

---

## Phase 2 — Commerce schema: customers, addresses, orders, items, payments, measurement requests

**Goal:** the data model for both order flows + the free-measurement booking.

```ts
// ---- customers (guest-friendly, phone is the key for India) ----
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull().unique(),     // E.164, e.g. +9198...
  name: text("name").notNull(),
  email: text("email"),
  authUserId: uuid("auth_user_id"),            // link to Supabase auth later; nullable now
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull().default("Kerala"),
  pincode: text("pincode").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

// ---- orders (one table, two flows) ----
export const orderTypeEnum = pgEnum("order_type", ["quote", "instant"]);
export const orderStatusEnum = pgEnum("order_status", [
  // shared
  "cancelled",
  // instant flow
  "pending_payment", "paid", "processing", "shipped", "delivered",
  // quote flow
  "enquiry", "quoted", "approved", "rejected", "confirmed", "in_production", "ready",
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),   // human ref, e.g. ALV-2406-0001
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  addressId: uuid("address_id").references(() => addresses.id),
  placeOfSupplyState: text("place_of_supply_state").notNull().default("Kerala"),
  subtotalInPaise: integer("subtotal_in_paise").notNull().default(0),
  taxInPaise: integer("tax_in_paise").notNull().default(0),
  shippingInPaise: integer("shipping_in_paise").notNull().default(0),
  totalInPaise: integer("total_in_paise").notNull().default(0),
  quotedTotalInPaise: integer("quoted_total_in_paise"),    // quote flow only; admin-set
  customerNote: text("customer_note"),                     // what they typed in the enquiry
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull(),                 // snapshot ref
  variantId: uuid("variant_id"),
  nameSnapshot: text("name_snapshot").notNull(),           // freeze name + variant at order time
  unitPriceInPaise: integer("unit_price_in_paise").notNull(),
  quantity: integer("quantity").notNull().default(1),
  customization: jsonb("customization").$type<Record<string, unknown>>().default({}),
  customizationNote: text("customization_note"),
});

// ---- payments (Razorpay) ----
export const paymentStatusEnum = pgEnum("payment_status", [
  "created", "captured", "failed", "refunded",
]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amountInPaise: integer("amount_in_paise").notNull(),
  status: paymentStatusEnum("status").notNull().default("created"),
  razorpayOrderId: text("razorpay_order_id"),              // instant flow
  razorpayPaymentLinkId: text("razorpay_payment_link_id"), // quote flow
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- free home measurement (your USP — first-class flow) ----
export const measurementStatusEnum = pgEnum("measurement_status", [
  "requested", "scheduled", "completed", "cancelled",
]);

export const measurementRequests = pgTable("measurement_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pincode: text("pincode").notNull(),
  area: text("area"),
  preferredSlot: text("preferred_slot"),                  // free text at launch
  note: text("note"),
  status: measurementStatusEnum("status").notNull().default("requested"),
  customerId: uuid("customer_id").references(() => customers.id),  // linked once known
  orderId: uuid("order_id").references(() => orders.id),           // if it becomes a quote
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Acceptance criteria

- [ ] All six tables exist with FKs and the enums above.
- [ ] Migration runs clean; a manual insert of a dummy customer → order → item works.

**▶ Claude Code prompt**
> Implement Phase 2 of IMPLEMENTATION_PLAN.md: add customers, addresses, orders,
> orderItems, payments, measurementRequests tables exactly as specified, with the
> listed enums. Generate the migration and a tiny seed/test script that inserts one
> customer, one instant order with one item, and prints it back. Show me the migration
> before running.

---

## Phase 3 — Domain logic: totals, order creation, status guards

**Goal:** pure functions + services. No HTTP yet. This is the part that must be
correct; keep it unit-testable.

### Files

- `lib/commerce/pricing.ts`
  - `computeTotals(items, { gstRateByItem, shippingInPaise })` → `{ subtotalInPaise, taxInPaise, totalInPaise }`. Round tax per line, then sum. All integer paise.
- `lib/commerce/orderNumber.ts`
  - `nextOrderNumber()` → `ALV-YYMM-NNNN` (sequence per month).
- `lib/commerce/status.ts`
  - `ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]>` for each flow.
  - `assertTransition(from, to)` throws on illegal moves.
  - Instant: `pending_payment → paid → processing → shipped → delivered`; any → `cancelled`.
  - Quote: `enquiry → quoted → (approved | rejected)`; `approved → confirmed → in_production → ready → delivered`; any non-terminal → `cancelled`.
- `lib/commerce/orders.ts`
  - `upsertCustomerByPhone(...)`.
  - `createInstantOrder({ customer, address, items })`: validates products are `purchaseMode='instant'`, snapshots prices/names, computes totals, inserts order(status `pending_payment`) + items, returns order.
  - `createQuoteEnquiry({ customer, items, note })`: products may be `quote`; inserts order(status `enquiry`), items snapshot the **indicative** price for reference, total stays 0 until quoted.
  - `setQuote(orderId, quotedTotalInPaise, adminNote)`: status `enquiry → quoted`, sets `quotedTotalInPaise`, recomputes `totalInPaise`.
  - `approveQuote(orderId)` / `rejectQuote(orderId)`.
  - `advanceStatus(orderId, to)`: wraps `assertTransition`.

### Acceptance criteria

- [ ] `computeTotals` has tests covering 0%, 12%, 18% GST and multi-line rounding.
- [ ] Illegal transitions throw (test instant→approved, quote→shipped).
- [ ] `createInstantOrder` rejects a product whose `purchaseMode` is `quote`.

**▶ Claude Code prompt**
> Implement Phase 3 of IMPLEMENTATION_PLAN.md: pricing, orderNumber, status guards,
> and the order service functions, in lib/commerce/*. Use integer paise throughout,
> snapshot prices/names onto order items, and enforce the status transition maps for
> both flows. Add vitest tests for pricing and status guards. Don't touch HTTP routes.

---

## Phase 4 — Razorpay integration

**Goal:** payments for both flows + a verified webhook.

### Files

- `lib/payments/razorpay.ts` — client init from env; helpers:
  - `createInstantRazorpayOrder(order)` → Razorpay Orders API, store `razorpayOrderId` on a `payments` row (status `created`).
  - `createQuotePaymentLink(order)` → Razorpay Payment Links API for `quotedTotalInPaise`, store `razorpayPaymentLinkId`; return the URL (you'll send it over WhatsApp).
  - `verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature })` — HMAC SHA256 with key secret.
  - `verifyWebhookSignature(rawBody, signature)` — HMAC with `RAZORPAY_WEBHOOK_SECRET`.

### Flows

- **Instant:** client cart → create DB order (Phase 3) → `createInstantRazorpayOrder` → return `{ razorpayOrderId, keyId, amount }` → client opens Checkout → on success POST to verify route → mark payment `captured`, order `paid`.
- **Quote:** admin `approveQuote` → `createQuotePaymentLink` → send URL via WhatsApp → customer pays → webhook `payment_link.paid` → mark payment `captured`, order `confirmed`.
- **Webhook** handles `payment.captured` (instant) and `payment_link.paid` (quote). Idempotent: ignore if payment already `captured`.

### Acceptance criteria

- [ ] Signature verification rejects a tampered payload.
- [ ] Webhook is idempotent (replaying the same event is a no-op).
- [ ] Amounts always come from the DB order, never from the client.

**▶ Claude Code prompt**
> Implement Phase 4 of IMPLEMENTATION_PLAN.md: lib/payments/razorpay.ts with instant
> order creation, quote payment links, checkout-signature verification, and webhook-
> signature verification. Amounts must be read from the DB order, not the request body.
> Make webhook handling idempotent.

---

## Phase 5 — API routes (App Router)

**Goal:** wire the services to HTTP. Validate every input with zod.

### Public

- `POST /api/measurement-requests` → create a measurement request (your lead magnet).
- `POST /api/orders/instant` → `createInstantOrder` + `createInstantRazorpayOrder`; returns checkout params.
- `POST /api/orders/instant/verify` → verify signature, mark paid.
- `POST /api/enquiries` → `createQuoteEnquiry`; returns order number + fires WhatsApp deep link (Phase 6).
- `POST /api/webhooks/razorpay` → raw-body webhook (disable body parsing / read raw).

### Admin (guarded by `ADMIN_EMAILS` + Supabase auth)

- `GET /api/admin/orders?type=&status=` — list/filter.
- `POST /api/admin/orders/:id/quote` — `setQuote`.
- `POST /api/admin/orders/:id/approve` — `approveQuote` + create payment link, return URL.
- `POST /api/admin/orders/:id/status` — `advanceStatus`.
- `GET /api/admin/measurement-requests` + `POST /:id/status`.

### Acceptance criteria

- [ ] Every route validates input with zod and returns typed errors.
- [ ] The webhook route reads the **raw** body for signature checks.
- [ ] Admin routes 401 without a valid admin session.

**▶ Claude Code prompt**
> Implement Phase 5 of IMPLEMENTATION_PLAN.md: the listed App Router route handlers,
> each with zod validation. Public routes for measurement requests, instant orders +
> verify, enquiries, and the Razorpay webhook (raw body). Admin routes behind an
> ADMIN_EMAILS + Supabase auth guard for listing orders, setting a quote, approving
> (returns payment link), and advancing status.

---

## Phase 6 — WhatsApp bridge + minimal admin views

**Goal:** at launch, WhatsApp is the human channel; admin needs just enough UI.

### WhatsApp

- `lib/notify/whatsapp.ts`:
  - `buildEnquiryLink(order)` → `https://wa.me/<BUSINESS_NUMBER>?text=<prefilled order summary>` for the customer to ping you.
  - On `approveQuote`, surface the Razorpay payment-link URL so admin can paste it into the WhatsApp chat (or auto-send later via WhatsApp Business API).

### Admin (server components, no fancy UI)

- `/admin/orders` — table: number, type, status, customer, total, actions (quote / approve / advance).
- `/admin/measurement-requests` — table with status actions.
- Reuse the Phase 5 admin routes.

### Acceptance criteria

- [ ] Submitting an enquiry produces a working `wa.me` link with a readable summary.
- [ ] Admin can move an order through its full lifecycle from the UI.

**▶ Claude Code prompt**
> Implement Phase 6 of IMPLEMENTATION_PLAN.md: lib/notify/whatsapp.ts with a wa.me
> deep-link builder for enquiries, and minimal /admin/orders and
> /admin/measurement-requests server-component pages that call the Phase 5 admin routes.

---

## Out of scope (later, intentionally)

- GST invoice PDF generation + CGST/SGST/IGST split columns.
- Customer login (Supabase Auth) — guest-by-phone is fine at launch.
- Inventory enforcement on instant items (track `stock`, gate checkout) — add when stockouts become real.
- WhatsApp Business API auto-send (start with manual `wa.me` paste).
- The scraped-data converter (handled separately).

## Suggested order of attack

Phase 1 and 2 are pure schema — do them back to back. Phase 3 is the brain; get its
tests green before touching money (Phase 4). Phases 5–6 are mechanical once 3–4 are solid.
