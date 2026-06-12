/**
 * Backfills products.purchase_mode + price_is_indicative by category.
 *
 * Mapping (IMPLEMENTATION_PLAN.md Phase 1):
 *  - quote  : sofa, bed, almirah, dining, dressing, sideboard, room_set, custom
 *             (room_set + custom additionally get price_is_indicative = true)
 *  - instant: mattress, coffee_table, chair, table
 *
 * Idempotent — safe to re-run. Only touches rows whose values differ.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-purchase-mode.ts            # uses DATABASE_URL (.env.local)
 *   DATABASE_URL=<prod-url> pnpm tsx scripts/backfill-purchase-mode.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { and, eq, inArray, ne, or } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { products } from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const db = drizzle(neon(url));

type Category = (typeof products.$inferSelect)["category"];

const QUOTE_CATEGORIES: Category[] = [
  "sofa", "bed", "almirah", "dining", "dressing", "sideboard",
];
const QUOTE_INDICATIVE_CATEGORIES: Category[] = ["room_set", "custom"];
const INSTANT_CATEGORIES: Category[] = [
  "mattress", "coffee_table", "chair", "table",
];

async function main() {
  const quoted = await db
    .update(products)
    .set({ purchaseMode: "quote" })
    .where(
      and(
        inArray(products.category, QUOTE_CATEGORIES),
        ne(products.purchaseMode, "quote"),
      ),
    )
    .returning({ slug: products.slug });

  const indicative = await db
    .update(products)
    .set({ purchaseMode: "quote", priceIsIndicative: true })
    .where(
      and(
        inArray(products.category, QUOTE_INDICATIVE_CATEGORIES),
        or(
          ne(products.purchaseMode, "quote"),
          eq(products.priceIsIndicative, false),
        ),
      ),
    )
    .returning({ slug: products.slug });

  const instant = await db
    .update(products)
    .set({ purchaseMode: "instant", priceIsIndicative: false })
    .where(
      and(
        inArray(products.category, INSTANT_CATEGORIES),
        or(
          ne(products.purchaseMode, "instant"),
          eq(products.priceIsIndicative, true),
        ),
      ),
    )
    .returning({ slug: products.slug });

  console.log(`→ quote:            ${quoted.length} updated`);
  console.log(`→ quote+indicative: ${indicative.length} updated`);
  console.log(`→ instant:          ${instant.length} updated`);

  const summary = await db
    .select({
      category: products.category,
      purchaseMode: products.purchaseMode,
      priceIsIndicative: products.priceIsIndicative,
    })
    .from(products);
  const counts = new Map<string, number>();
  for (const row of summary) {
    const key = `${row.category} → ${row.purchaseMode}${row.priceIsIndicative ? " (indicative)" : ""}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log("\nCurrent distribution:");
  for (const [key, n] of [...counts.entries()].sort()) {
    console.log(`  ${key}: ${n}`);
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
