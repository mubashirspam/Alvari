/**
 * Seeds per-category variant attribute definitions (IMPLEMENTATION_PLAN.md
 * Phase 2). Idempotent: upserts on (category, key) — re-running updates
 * label/options in place. Options are editable later from the admin UI.
 *
 * Usage:
 *   pnpm tsx scripts/seed-variant-attributes.ts
 *   DATABASE_URL=<prod-url> pnpm tsx scripts/seed-variant-attributes.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categoryVariantAttributes, products } from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const db = drizzle(neon(url));

type Category = (typeof products.$inferSelect)["category"];
type InputType = "select" | "color" | "text";

type Def = {
  key: string;
  label: string;
  inputType?: InputType;
  options: string[];
  isRequired?: boolean;
};

const SEED: Partial<Record<Category, Def[]>> = {
  almirah: [
    { key: "doors", label: "Doors", options: ["2 Door", "3 Door", "4 Door"] },
    { key: "material", label: "Material", options: ["Teak", "Sheesham", "Mango Wood", "Engineered Wood"] },
  ],
  bed: [
    { key: "size", label: "Size", options: ["Single", "Double", "Queen", "King"] },
    { key: "material", label: "Material", options: ["Teak", "Sheesham", "Mango Wood"] },
  ],
  sofa: [
    { key: "seater", label: "Seater", options: ["1 Seater", "2 Seater", "3 Seater", "L-Shape"] },
    { key: "fabric", label: "Fabric", options: ["Cotton", "Linen", "Velvet", "Leatherette"], isRequired: false },
  ],
  mattress: [
    { key: "size", label: "Size", options: ["Single", "Double", "Queen", "King"] },
    { key: "thickness", label: "Thickness", options: ["4 inch", "5 inch", "6 inch", "8 inch"] },
  ],
  dining: [
    { key: "seater", label: "Seater", options: ["4 Seater", "6 Seater", "8 Seater"] },
    { key: "material", label: "Material", options: ["Teak", "Sheesham", "Mango Wood"], isRequired: false },
  ],
  dressing: [
    { key: "material", label: "Material", options: ["Teak", "Sheesham", "Mango Wood"] },
  ],
  sideboard: [
    { key: "material", label: "Material", options: ["Teak", "Sheesham", "Mango Wood"] },
  ],
  chair: [
    { key: "material", label: "Material", options: ["Teak", "Sheesham", "Cane", "Upholstered"] },
  ],
  table: [
    { key: "finish", label: "Finish", options: ["Natural", "Walnut", "Honey"], isRequired: false },
  ],
  coffee_table: [
    { key: "finish", label: "Finish", options: ["Natural", "Walnut", "Honey"], isRequired: false },
  ],
};

async function main() {
  let upserted = 0;
  for (const [category, defs] of Object.entries(SEED) as [Category, Def[]][]) {
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      await db
        .insert(categoryVariantAttributes)
        .values({
          category,
          key: def.key,
          label: def.label,
          inputType: def.inputType ?? "select",
          options: def.options,
          isRequired: def.isRequired ?? true,
          sortOrder: i,
        })
        .onConflictDoUpdate({
          target: [categoryVariantAttributes.category, categoryVariantAttributes.key],
          set: {
            label: def.label,
            inputType: def.inputType ?? "select",
            options: def.options,
            isRequired: def.isRequired ?? true,
            sortOrder: i,
          },
        });
      upserted++;
    }
  }
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categoryVariantAttributes);
  console.log(`Upserted ${upserted} definitions; table now has ${count} rows.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
