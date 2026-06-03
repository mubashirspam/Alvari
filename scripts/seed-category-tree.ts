/**
 * Seeds the navigation category tree (Furniture / Mattresses / Home Goods →
 * rooms & materials → product-type leaves). Idempotent: keyed on (parentId, slug),
 * so re-running updates in place instead of duplicating.
 *
 * Usage:
 *   pnpm tsx scripts/seed-category-tree.ts            # uses DATABASE_URL (.env.local)
 *   DATABASE_URL=<prod-url> pnpm tsx scripts/seed-category-tree.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { and, eq, isNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categoryNodes } from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const db = drizzle(neon(url));

type Cat =
  | "almirah" | "bed" | "sofa" | "dining" | "dressing" | "coffee_table"
  | "mattress" | "room_set" | "custom" | "chair" | "sideboard" | "table";

type Seed = {
  name: string;
  slug: string;
  linkCategory?: Cat;
  material?: string;
  linkHref?: string;
  children?: Seed[];
};

const leaf = (name: string, slug: string, linkCategory: Cat, material?: string): Seed => ({
  name,
  slug,
  linkCategory,
  material,
});

const TREE: Seed[] = [
  {
    name: "Furniture",
    slug: "furniture",
    children: [
      {
        name: "Living Room",
        slug: "living-room",
        children: [
          leaf("Sofas", "sofa", "sofa"),
          leaf("Coffee Tables", "coffee-table", "coffee_table"),
          leaf("TV & Media Units", "tv-units", "sideboard"),
        ],
      },
      {
        name: "Bed Room",
        slug: "bed-room",
        children: [
          leaf("Wardrobes", "almirah", "almirah"),
          leaf("Beds", "bed", "bed"),
          leaf("Dressing Tables", "dressing", "dressing"),
        ],
      },
      {
        name: "Dining Room",
        slug: "dining-room",
        children: [
          leaf("Dining Sets", "dining", "dining"),
          leaf("Sideboards", "sideboard", "sideboard"),
        ],
      },
      {
        name: "Study Room",
        slug: "study-room",
        children: [
          leaf("Study Tables", "table", "table"),
          leaf("Chairs", "chair", "chair"),
        ],
      },
      {
        name: "Solid Wood",
        slug: "solid-wood",
        children: [
          leaf("Wardrobes", "almirah", "almirah", "solid"),
          leaf("Beds", "bed", "bed", "solid"),
          leaf("Sofas", "sofa", "sofa", "solid"),
          leaf("Dining Sets", "dining", "dining", "solid"),
        ],
      },
      {
        name: "Engineered Wood",
        slug: "engineered-wood",
        children: [
          leaf("Wardrobes", "almirah", "almirah", "engineered"),
          leaf("Beds", "bed", "bed", "engineered"),
          leaf("TV & Media Units", "tv-units", "sideboard", "engineered"),
        ],
      },
      {
        name: "Luxury Furniture",
        slug: "luxury-furniture",
        children: [leaf("Complete Room Sets", "room-set", "room_set")],
      },
    ],
  },
  {
    name: "Mattresses",
    slug: "mattresses",
    children: [leaf("Mattresses", "mattress", "mattress")],
  },
  {
    name: "Home Goods",
    slug: "home-goods",
    linkHref: "/products",
    children: [],
  },
];

async function upsert(node: Seed, parentId: string | null, sort: number): Promise<string> {
  const existing = await db
    .select()
    .from(categoryNodes)
    .where(
      and(
        eq(categoryNodes.slug, node.slug),
        parentId ? eq(categoryNodes.parentId, parentId) : isNull(categoryNodes.parentId),
      ),
    )
    .limit(1);

  const values = {
    name: node.name,
    linkCategory: node.linkCategory ?? null,
    material: node.material ?? null,
    linkHref: node.linkHref ?? null,
    sortOrder: sort,
  };

  let id: string;
  if (existing[0]) {
    id = existing[0].id;
    await db
      .update(categoryNodes)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(categoryNodes.id, id));
  } else {
    const inserted = await db
      .insert(categoryNodes)
      .values({ ...values, slug: node.slug, parentId })
      .returning();
    id = inserted[0].id;
  }

  let i = 0;
  for (const child of node.children ?? []) {
    await upsert(child, id, i++);
  }
  return id;
}

async function main() {
  let i = 0;
  for (const top of TREE) await upsert(top, null, i++);
  console.log("✓ Category tree seeded.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
