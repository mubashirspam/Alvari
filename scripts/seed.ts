import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  blogPosts,
  productBlogSections,
  productImages,
  productVariants,
  products,
  type NewBlogPostRow,
  type NewProductImageRow,
  type NewProductRow,
  type NewProductVariantRow,
  type VariantAttributes,
} from "../lib/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(url);
const db = drizzle(sql);

type VariantSeed = {
  sku: string;
  name: string;
  attributes: VariantAttributes;
  priceNowInPaise: number;
  priceWasInPaise: number;
  stock: number;
  isDefault?: boolean;
  sortOrder: number;
  images: { imageKey: string; alt: string; sortOrder: number }[];
};

type ProductSeed = NewProductRow & {
  sharedImages: { imageKey: string; alt: string; sortOrder: number }[];
  variants: VariantSeed[];
  blogSlugs: string[];
};

const productSeeds: ProductSeed[] = [
  {
    slug: "heirloom-sheesham-almirah",
    name: "Heirloom Sheesham Almirah",
    category: "almirah",
    meta: "6ft × 4ft · Brass handles · 3 shelves",
    description:
      "A solid sheesham wardrobe with hand-fitted brass handles, adjustable shelves, and a full-height hanging rail.",
    longDescription: `## Built to outlive a lifetime

Our Heirloom Almirah is fabricated from a **single stock of A-grade sheesham** — the same slow-grown Indian rosewood used for temple doors and antique almirahs a hundred years ago. Each plank is kiln-seasoned to 10% moisture, hand-planed, and joined with traditional mortise-and-tenon joinery (no staples, no particle board).

### What makes it last

- **Solid sheesham throughout** — frame, door panels, shelves, back board. Not veneered MDF.
- **Brass hardware** machined in Moradabad and finished with an anti-tarnish lacquer.
- **Adjustable shelving** — change the interior layout as your storage needs evolve.
- **Lock-and-key** with two keys shipped, plus a hidden bolt for the second door.

### Finish options

We finish in three tones — natural oil (shows the grain), walnut stain (warmer), and ebony rub (deepest). Natural oil darkens over 5–10 years into a rich honey-brown patina — this is the heirloom path.`,
    brand: "Alvari",
    material: "Solid Sheesham (Indian Rosewood)",
    warrantyMonths: 60,
    careInstructions:
      "Dust weekly with a soft dry cloth. Oil once a year with teak oil. Keep away from direct sunlight and radiators. Wipe spills immediately — do not use ammonia or vinegar cleaners.",
    dimensions: "72in H × 48in W × 22in D (183 × 122 × 56 cm)",
    weightKg: "92.50",
    priceNowInPaise: 2_850_000,
    priceWasInPaise: 4_500_000,
    badge: "bestseller",
    illustrationKey: "almirah",
    gradientFrom: "#8B5E3C",
    gradientTo: "#3E2818",
    isFeatured: true,
    sortOrder: 1,
    sharedImages: [
      {
        imageKey: "/alvari/products/almirah-heirloom/lifestyle.jpg",
        alt: "Sheesham almirah in a Wayanad bedroom",
        sortOrder: 10,
      },
      {
        imageKey: "/alvari/products/almirah-heirloom/joinery-detail.jpg",
        alt: "Mortise-and-tenon joinery detail",
        sortOrder: 11,
      },
    ],
    variants: [
      {
        sku: "ALM-HEIR-2D-NAT",
        name: "2-Door · Natural Oil",
        attributes: {
          doors: 2,
          finish: "Natural Oil",
          mirror: false,
          hanging_rail: true,
          shelves: 3,
        },
        priceNowInPaise: 2_850_000,
        priceWasInPaise: 4_500_000,
        stock: 6,
        isDefault: true,
        sortOrder: 1,
        images: [
          {
            imageKey: "/alvari/products/almirah-heirloom/2d-natural-front.jpg",
            alt: "2-door natural oil almirah — front",
            sortOrder: 1,
          },
          {
            imageKey: "/alvari/products/almirah-heirloom/2d-natural-open.jpg",
            alt: "2-door natural oil almirah — open",
            sortOrder: 2,
          },
        ],
      },
      {
        sku: "ALM-HEIR-3D-GLS-WAL",
        name: "3-Door with Glass · Walnut Stain",
        attributes: {
          doors: 3,
          finish: "Walnut Stain",
          mirror: false,
          glass_center_panel: true,
          hanging_rail: true,
          shelves: 4,
        },
        priceNowInPaise: 3_650_000,
        priceWasInPaise: 5_600_000,
        stock: 3,
        sortOrder: 2,
        images: [
          {
            imageKey: "/alvari/products/almirah-heirloom/3d-glass-walnut.jpg",
            alt: "3-door almirah with glass center panel in walnut",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "ALM-HEIR-5D-EBN",
        name: "5-Door Palatial · Ebony Rub",
        attributes: {
          doors: 5,
          finish: "Ebony Rub",
          mirror: true,
          hanging_rail: true,
          shelves: 6,
          drawers: 3,
        },
        priceNowInPaise: 5_250_000,
        priceWasInPaise: 8_200_000,
        stock: 2,
        sortOrder: 3,
        images: [
          {
            imageKey: "/alvari/products/almirah-heirloom/5d-ebony.jpg",
            alt: "5-door palatial almirah in ebony",
            sortOrder: 1,
          },
        ],
      },
    ],
    blogSlugs: ["sourcing-sheesham-wayanad", "almirah-buying-guide"],
  },
  {
    slug: "king-storage-bed",
    name: "King Storage Bed",
    category: "bed",
    meta: '78" × 72" · Hydraulic storage · Teak finish',
    description:
      "King-size teak bed with a hydraulic lift platform and upholstered headboard in handloom fabric.",
    longDescription: `## Storage that disappears

The King Storage Bed hides a **full-size storage bay** under a hydraulic-assisted lift platform. The gas struts are German (Suspa) with a **50,000-cycle rating** — lift with one hand, stay open safely.

### Frame and finish

- **Burma teak** frame with machined corner joints. We do not use rubberwood or MDF.
- **Upholstered headboard** with high-density foam (40 density) wrapped in handloom fabric.
- **Five fabric options** — Beige Khadi, Forest Green, Terracotta, Midnight Blue, Oat Linen.
- **Ventilated ply** base lets your mattress breathe (no moisture traps).

### Sizes

Standard king (78" × 72"). Custom sizes available on request — add 2 weeks lead time.`,
    brand: "Alvari",
    material: "Burma Teak + Handloom Upholstery",
    warrantyMonths: 36,
    careInstructions:
      "Vacuum upholstery monthly. Spot-clean with a mild soap solution — do not soak. Oil teak legs once per year.",
    dimensions: "78in L × 72in W × 46in H (198 × 183 × 117 cm)",
    weightKg: "115.00",
    priceNowInPaise: 3_490_000,
    priceWasInPaise: 5_800_000,
    badge: "new",
    illustrationKey: "bed",
    gradientFrom: "#A67C5A",
    gradientTo: "#4A2F1E",
    isFeatured: true,
    sortOrder: 2,
    sharedImages: [
      {
        imageKey: "/alvari/products/bed-king-storage/lifestyle.jpg",
        alt: "King storage bed styled in a bedroom",
        sortOrder: 10,
      },
      {
        imageKey: "/alvari/products/bed-king-storage/hydraulic-detail.jpg",
        alt: "Hydraulic lift mechanism detail",
        sortOrder: 11,
      },
    ],
    variants: [
      {
        sku: "BED-KS-BEIGE",
        name: "King · Beige Khadi",
        attributes: {
          size: "King (78x72)",
          fabric: "Beige Khadi",
          storage: true,
        },
        priceNowInPaise: 3_490_000,
        priceWasInPaise: 5_800_000,
        stock: 4,
        isDefault: true,
        sortOrder: 1,
        images: [
          {
            imageKey: "/alvari/products/bed-king-storage/beige.jpg",
            alt: "King storage bed in beige khadi",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "BED-KS-FOREST",
        name: "King · Forest Green",
        attributes: {
          size: "King (78x72)",
          fabric: "Forest Green",
          storage: true,
        },
        priceNowInPaise: 3_590_000,
        priceWasInPaise: 5_800_000,
        stock: 3,
        sortOrder: 2,
        images: [
          {
            imageKey: "/alvari/products/bed-king-storage/forest.jpg",
            alt: "King storage bed in forest green",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "BED-KS-TERRA",
        name: "King · Terracotta",
        attributes: {
          size: "King (78x72)",
          fabric: "Terracotta",
          storage: true,
        },
        priceNowInPaise: 3_590_000,
        priceWasInPaise: 5_800_000,
        stock: 3,
        sortOrder: 3,
        images: [
          {
            imageKey: "/alvari/products/bed-king-storage/terracotta.jpg",
            alt: "King storage bed in terracotta",
            sortOrder: 1,
          },
        ],
      },
    ],
    blogSlugs: ["teak-care-guide"],
  },
  {
    slug: "3-plus-2-sofa-setti",
    name: "3+2 Sofa Setti",
    category: "sofa",
    meta: "Solid wood frame · Fabric · 5 colours",
    description:
      "Classic Kerala-style setti with a solid sheesham frame, jute-webbed seat base, and removable cushions.",
    longDescription: `## A setti that stays firm

Our 3+2 Sofa Setti uses a **traditional jute webbing** seat base — the same technique used in heritage Kerala homes. Unlike sagging S-springs, jute maintains its tension for 15+ years with occasional re-stretching (we offer this as a free service for life).

### Build

- **Sheesham frame** — every joint pinned and glued, reinforced with corner blocks.
- **Jute webbing** seat suspension (180 gsm Calcutta jute).
- **High-density foam** cushions (32 density) with fibre-filled back pillows for softness.
- **Removable covers** — zip off and wash at home.

### Five fabric palettes

All fabrics are **stain-resistant** with a C6 fluorocarbon treatment. Rated 30,000 Martindale cycles — commercial-grade.`,
    brand: "Alvari",
    material: "Sheesham Frame + Stain-Resistant Fabric",
    warrantyMonths: 24,
    careInstructions:
      "Vacuum weekly. Fluff back cushions daily. Remove covers and wash cold (separately, line-dry).",
    dimensions: '3-seater: 78" × 36" · 2-seater: 54" × 36"',
    weightKg: "78.00",
    priceNowInPaise: 3_200_000,
    priceWasInPaise: 5_200_000,
    badge: "trending",
    illustrationKey: "sofa",
    gradientFrom: "#9C6B47",
    gradientTo: "#3E2818",
    isFeatured: true,
    sortOrder: 3,
    sharedImages: [
      {
        imageKey: "/alvari/products/sofa-setti/lifestyle.jpg",
        alt: "3+2 setti in a Kerala living room",
        sortOrder: 10,
      },
    ],
    variants: [
      {
        sku: "SOF-SETTI-3P2-BEIGE",
        name: "3+2 · Beige Linen",
        attributes: { configuration: "3+2", fabric: "Beige Linen" },
        priceNowInPaise: 3_200_000,
        priceWasInPaise: 5_200_000,
        stock: 5,
        isDefault: true,
        sortOrder: 1,
        images: [
          {
            imageKey: "/alvari/products/sofa-setti/beige-linen.jpg",
            alt: "3+2 setti in beige linen",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "SOF-SETTI-3P2-OLIVE",
        name: "3+2 · Olive Green",
        attributes: { configuration: "3+2", fabric: "Olive Green" },
        priceNowInPaise: 3_200_000,
        priceWasInPaise: 5_200_000,
        stock: 4,
        sortOrder: 2,
        images: [
          {
            imageKey: "/alvari/products/sofa-setti/olive.jpg",
            alt: "3+2 setti in olive green",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "SOF-SETTI-3P1P1-MUSTARD",
        name: "3+1+1 · Mustard",
        attributes: { configuration: "3+1+1", fabric: "Mustard" },
        priceNowInPaise: 3_600_000,
        priceWasInPaise: 5_800_000,
        stock: 3,
        sortOrder: 3,
        images: [
          {
            imageKey: "/alvari/products/sofa-setti/mustard-3-1-1.jpg",
            alt: "3+1+1 setti in mustard",
            sortOrder: 1,
          },
        ],
      },
    ],
    blogSlugs: ["jute-webbing-vs-springs"],
  },
  {
    slug: "6-seater-dining-set",
    name: "6-Seater Dining Set",
    category: "dining",
    meta: "Oval teakwood top · 6 cushioned chairs",
    description:
      "Oval teakwood dining table with six hand-turned chairs and removable cushioned seats.",
    longDescription: `## Built to gather

A dining table is where a family actually lives. Ours is designed for daily, intense use — spills, homework, biryani nights, visitors on short notice.

### Table top

- **Burma teak top**, 1.25" thick, with a **hand-rubbed oil finish** (not lacquer). Heat and water resistant.
- **Beveled edge** that's kinder on forearms than sharp corners.
- **Extends** from 72" → 96" with a central leaf (leaf stores under the table).

### Chairs

Six hand-turned teak chairs with **removable cushion pads** in your choice of fabric. Backrests are slightly sprung for comfort.`,
    brand: "Alvari",
    material: "Burma Teak with Oil Finish",
    warrantyMonths: 36,
    careInstructions:
      "Wipe with a damp cloth. Oil once per year with teak oil. Use coasters for hot dishes.",
    dimensions: "72in L (96in extended) × 42in W × 30in H",
    weightKg: "68.00",
    priceNowInPaise: 4_250_000,
    priceWasInPaise: 6_800_000,
    badge: "value_pick",
    illustrationKey: "dining",
    gradientFrom: "#B8956B",
    gradientTo: "#5C3A24",
    isFeatured: true,
    sortOrder: 4,
    sharedImages: [
      {
        imageKey: "/alvari/products/dining-6/lifestyle.jpg",
        alt: "6-seater dining set",
        sortOrder: 10,
      },
    ],
    variants: [
      {
        sku: "DIN-6-OVAL-CREAM",
        name: "Oval · Cream Cushions",
        attributes: { shape: "Oval", seats: 6, cushion: "Cream" },
        priceNowInPaise: 4_250_000,
        priceWasInPaise: 6_800_000,
        stock: 3,
        isDefault: true,
        sortOrder: 1,
        images: [
          {
            imageKey: "/alvari/products/dining-6/oval-cream.jpg",
            alt: "Oval dining table with cream cushions",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "DIN-6-OVAL-FOREST",
        name: "Oval · Forest Green Cushions",
        attributes: { shape: "Oval", seats: 6, cushion: "Forest Green" },
        priceNowInPaise: 4_250_000,
        priceWasInPaise: 6_800_000,
        stock: 2,
        sortOrder: 2,
        images: [
          {
            imageKey: "/alvari/products/dining-6/oval-forest.jpg",
            alt: "Oval dining table with forest cushions",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "DIN-8-RECT-CREAM",
        name: "Rectangular 8-Seater · Cream",
        attributes: { shape: "Rectangular", seats: 8, cushion: "Cream" },
        priceNowInPaise: 5_450_000,
        priceWasInPaise: 8_200_000,
        stock: 2,
        sortOrder: 3,
        images: [
          {
            imageKey: "/alvari/products/dining-6/rect-8.jpg",
            alt: "Rectangular 8-seater dining table",
            sortOrder: 1,
          },
        ],
      },
    ],
    blogSlugs: ["teak-care-guide"],
  },
  {
    slug: "vanity-dressing-table",
    name: "Vanity Dressing Table",
    category: "dressing",
    meta: "Oval mirror · 4 drawers · Stool included",
    description:
      "Compact vanity with a bevelled oval mirror, soft-close drawers, and a matching upholstered stool.",
    longDescription: `## A quiet corner of your own

Compact enough for small bedrooms, detailed enough to feel special. The **bevelled oval mirror** is silver-backed and hand-finished — not a mass-market cut glass.

### Details

- **Sheesham frame** with inlay detail on drawer fronts.
- **Soft-close drawer runners** (Hettich, German).
- **Matching stool** with removable upholstered cushion.
- **Cable cutout** in back panel for hair tools.`,
    brand: "Alvari",
    material: "Solid Sheesham + Bevelled Mirror",
    warrantyMonths: 24,
    careInstructions:
      "Dust weekly. Clean mirror with glass cleaner (avoid over-spray on wood).",
    dimensions: "42in W × 18in D × 60in H (incl. mirror)",
    weightKg: "34.00",
    priceNowInPaise: 1_480_000,
    priceWasInPaise: 2_400_000,
    badge: "new",
    illustrationKey: "dressing",
    gradientFrom: "#7A5037",
    gradientTo: "#3A2015",
    isFeatured: true,
    sortOrder: 5,
    sharedImages: [
      {
        imageKey: "/alvari/products/dressing-vanity/lifestyle.jpg",
        alt: "Vanity dressing table in bedroom",
        sortOrder: 10,
      },
    ],
    variants: [
      {
        sku: "DRS-VAN-4D-NAT",
        name: "4-Drawer · Natural",
        attributes: { drawers: 4, finish: "Natural Oil", stool: true },
        priceNowInPaise: 1_480_000,
        priceWasInPaise: 2_400_000,
        stock: 5,
        isDefault: true,
        sortOrder: 1,
        images: [
          {
            imageKey: "/alvari/products/dressing-vanity/4d-natural.jpg",
            alt: "4-drawer vanity in natural finish",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "DRS-VAN-6D-WAL",
        name: "6-Drawer Deluxe · Walnut",
        attributes: { drawers: 6, finish: "Walnut Stain", stool: true },
        priceNowInPaise: 1_850_000,
        priceWasInPaise: 2_900_000,
        stock: 3,
        sortOrder: 2,
        images: [
          {
            imageKey: "/alvari/products/dressing-vanity/6d-walnut.jpg",
            alt: "6-drawer vanity in walnut",
            sortOrder: 1,
          },
        ],
      },
    ],
    blogSlugs: ["sourcing-sheesham-wayanad"],
  },
  {
    slug: "complete-bedroom-set",
    name: "Complete Bedroom Set",
    category: "room_set",
    meta: "Bed + 4-door Almirah + Dresser + Side Tables",
    description:
      "A coordinated bedroom — king bed, four-door wardrobe, dressing unit, and matching side tables.",
    longDescription: `## One grain story, five pieces

When you buy pieces individually over time, the wood grain and finish rarely match. Our bedroom sets are **cut from the same stock in the same batch** so every piece looks like family.

### Included

- King Storage Bed (78" × 72")
- 4-Door Almirah with mirror
- Dresser with 6 drawers + bevelled mirror
- Two matching side tables

### Lead time

Made-to-order: **6–8 weeks**. We cut all pieces from the same batch of wood and finish them together to ensure grain and tone match across the set.`,
    brand: "Alvari",
    material: "Solid Sheesham (matched grain batch)",
    warrantyMonths: 60,
    careInstructions:
      "Oil wood once per year. Dust weekly. Rotate mattress quarterly.",
    dimensions: "Multiple pieces — see product spec sheet",
    weightKg: "310.00",
    priceNowInPaise: 7_800_000,
    priceWasInPaise: 13_500_000,
    badge: "best_value",
    illustrationKey: "room_set",
    gradientFrom: "#5C3A24",
    gradientTo: "#261812",
    isFeatured: true,
    sortOrder: 6,
    sharedImages: [
      {
        imageKey: "/alvari/products/bedroom-set/lifestyle.jpg",
        alt: "Full bedroom set coordinated",
        sortOrder: 10,
      },
    ],
    variants: [
      {
        sku: "SET-BED-STD-NAT",
        name: "Standard · Natural Oil",
        attributes: { finish: "Natural Oil", mirror: true, sideTables: 2 },
        priceNowInPaise: 7_800_000,
        priceWasInPaise: 13_500_000,
        stock: 1,
        isDefault: true,
        sortOrder: 1,
        images: [
          {
            imageKey: "/alvari/products/bedroom-set/standard-natural.jpg",
            alt: "Standard bedroom set in natural",
            sortOrder: 1,
          },
        ],
      },
      {
        sku: "SET-BED-PREM-WAL",
        name: "Premium · Walnut + Upholstered Headboard",
        attributes: {
          finish: "Walnut Stain",
          mirror: true,
          sideTables: 2,
          upholsteredHeadboard: true,
        },
        priceNowInPaise: 9_200_000,
        priceWasInPaise: 15_800_000,
        stock: 1,
        sortOrder: 2,
        images: [
          {
            imageKey: "/alvari/products/bedroom-set/premium-walnut.jpg",
            alt: "Premium bedroom set in walnut",
            sortOrder: 1,
          },
        ],
      },
    ],
    blogSlugs: ["sourcing-sheesham-wayanad", "almirah-buying-guide"],
  },
];

const blogSeeds: NewBlogPostRow[] = [
  {
    slug: "sourcing-sheesham-wayanad",
    title: "How we source sheesham in Wayanad",
    excerpt:
      "Every log we mill can be traced back to a licensed plot and a specific cutting permit.",
    coverImageKey: "/alvari/blog/sheesham-sourcing.jpg",
    contentMarkdown: `## Traceable timber, always

Wayanad sheesham is one of India's most counterfeited woods. Mills pass off soft acacia or poplar with walnut stain and call it "rosewood." We don't play that game.

### Our sourcing process

1. **Licensed plots only** — we buy from 12 registered Wayanad growers with active Forest Department permits.
2. **Cutting permit on file** for every log before it enters our yard.
3. **Moisture meter check** at intake — anything above 14% goes into the kiln for 30 days.
4. **Grain photograph** recorded against the finished product ID so you can see the exact plank in your piece.

### Why it matters

When you pay premium for solid wood, you deserve to know it's the wood you paid for. Our kiln log is available to any customer on request — just ask.`,
    authorName: "Alvari Workshop",
    readingMinutes: 5,
    isPublished: true,
    publishedAt: new Date("2025-09-12T09:00:00Z"),
  },
  {
    slug: "teak-care-guide",
    title: "A 5-minute care guide for teak furniture",
    excerpt:
      "Teak is low maintenance, not no maintenance. Here's what actually matters over 20 years.",
    coverImageKey: "/alvari/blog/teak-care.jpg",
    contentMarkdown: `## The only care routine you need

Teak has natural oils that resist water and insects. That doesn't mean you should ignore it. A little care adds decades.

### Daily

- Dust with a **soft dry microfibre** — no chemical sprays.
- Wipe spills immediately with a damp cloth.

### Yearly

Rub in **teak oil** (not polish, not lacquer) once a year. Apply along the grain, let sit 15 minutes, buff off. Skip if you like a weathered silver-grey patina — that's fine too, it's a finish choice.

### Never do this

- **Ammonia cleaners.** They pull the natural oil out and leave the wood brittle.
- **Direct sun for hours.** Some sun is fine. Eight hours a day will dry and crack.
- **Wet rings from hot dishes.** Use coasters or a cloth runner.`,
    authorName: "Ravi, Workshop Lead",
    readingMinutes: 3,
    isPublished: true,
    publishedAt: new Date("2025-10-02T09:00:00Z"),
  },
  {
    slug: "almirah-buying-guide",
    title: "The almirah buying guide we wish we had",
    excerpt:
      "What to check, what to ignore, and the three questions that expose a cheap build.",
    coverImageKey: "/alvari/blog/almirah-guide.jpg",
    contentMarkdown: `## Before you buy any almirah

Most "solid wood" almirahs in the market are **veneered MDF with wooden frames**. The trick is to know where to look.

### The three questions

1. **"Can I see the back panel from inside?"** A real solid-wood almirah has a solid back. Cheaper builds use 3mm hardboard.
2. **"What's the shelf made of?"** Many almirahs have solid frames but **particle-board shelves** that sag under weight in 2 years.
3. **"Are the hinges full-length or spot-mounted?"** Spot-mounted hinges on heavy solid doors eventually tear out. Look for a **piano hinge** or multiple heavy cup hinges.

### Joinery red flags

- **Staples visible inside** → avoid.
- **L-brackets at corners instead of joinery** → avoid.
- **Doors that don't close flush** → the frame isn't square; send it back.

### What to actually pay for

- **Wood grade.** A-grade sheesham vs B-grade is a 30% price difference for a 3× longer life.
- **Hardware.** Brass handles stay beautiful. Stamped steel looks cheap in a year.
- **Hinges.** You'll open the door 10,000 times. Cheap hinges fail at ~3,000.`,
    authorName: "Alvari Workshop",
    readingMinutes: 6,
    isPublished: true,
    publishedAt: new Date("2025-11-18T09:00:00Z"),
  },
  {
    slug: "jute-webbing-vs-springs",
    title: "Jute webbing vs S-springs: why we chose the old way",
    excerpt:
      "S-springs are cheaper and faster to install. They're also why your last sofa sagged.",
    coverImageKey: "/alvari/blog/jute-webbing.jpg",
    contentMarkdown: `## Why sofas sag

A sofa's seat base is the single biggest determinant of how it ages. Three common approaches:

- **S-springs (sinuous springs)**: steel zigzag wires. Cheap, quick. Sag in 3–5 years as the steel fatigues.
- **Pocket springs**: small pocketed coils. Comfortable but hard to re-tension.
- **Jute webbing**: woven jute strips interlaced across the frame. Slow to install. Lasts 15+ years with free periodic re-stretching.

### Why jute

Every jute strap can be **individually re-tensioned** without dismantling the sofa. When one strap loosens over years, we pop the dust cover, pull the strap tight with a tensioner, and staple it. Twenty minutes. Zero cost.

That's why we offer **lifetime free webbing re-tensioning** on every setti we build — the structure makes it possible.`,
    authorName: "Ravi, Workshop Lead",
    readingMinutes: 4,
    isPublished: true,
    publishedAt: new Date("2025-12-08T09:00:00Z"),
  },
  {
    slug: "care-finish-comparison",
    title: "Natural oil vs walnut stain vs ebony rub: what ages best",
    excerpt:
      "A short guide to the three finishes we offer and how they look in year 1, 5, and 10.",
    coverImageKey: "/alvari/blog/finish-comparison.jpg",
    contentMarkdown: `## Three finishes, three stories

### Natural oil

Shows the grain. Starts honey-coloured. Darkens to a warm amber over 5–10 years. **Best for heirloom pieces** — develops character with age.

### Walnut stain

Even, warm, chocolate tone from day one. Stays consistent. **Best for coordinated rooms** where you want pieces to match forever.

### Ebony rub

Near-black with grain still visible underneath. Dramatic. Hides scratches well. **Best for modern rooms** and renters who move often.

Ask for a finish sample — we'll send small wood cards in the mail so you can hold them against your wall paint before deciding.`,
    authorName: "Alvari Workshop",
    readingMinutes: 3,
    isPublished: true,
    publishedAt: new Date("2026-01-20T09:00:00Z"),
  },
];

async function upsertProduct(
  seed: ProductSeed,
): Promise<string> {
  const row: NewProductRow = {
    slug: seed.slug,
    name: seed.name,
    category: seed.category,
    meta: seed.meta,
    description: seed.description,
    longDescription: seed.longDescription,
    brand: seed.brand,
    material: seed.material,
    warrantyMonths: seed.warrantyMonths,
    careInstructions: seed.careInstructions,
    dimensions: seed.dimensions,
    weightKg: seed.weightKg,
    priceNowInPaise: seed.priceNowInPaise,
    priceWasInPaise: seed.priceWasInPaise,
    badge: seed.badge,
    illustrationKey: seed.illustrationKey,
    gradientFrom: seed.gradientFrom,
    gradientTo: seed.gradientTo,
    isFeatured: seed.isFeatured,
    isActive: seed.isActive,
    sortOrder: seed.sortOrder,
  };
  const [result] = await db
    .insert(products)
    .values(row)
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        name: row.name,
        meta: row.meta,
        description: row.description,
        longDescription: row.longDescription,
        brand: row.brand,
        material: row.material,
        warrantyMonths: row.warrantyMonths,
        careInstructions: row.careInstructions,
        dimensions: row.dimensions,
        weightKg: row.weightKg,
        priceNowInPaise: row.priceNowInPaise,
        priceWasInPaise: row.priceWasInPaise,
        badge: row.badge,
        illustrationKey: row.illustrationKey,
        gradientFrom: row.gradientFrom,
        gradientTo: row.gradientTo,
        isFeatured: row.isFeatured,
        isActive: row.isActive ?? true,
        sortOrder: row.sortOrder,
        category: row.category,
        updatedAt: new Date(),
      },
    })
    .returning({ id: products.id });
  return result.id;
}

async function upsertVariantsAndImages(
  productId: string,
  seed: ProductSeed,
): Promise<void> {
  await db.delete(productImages).where(eq(productImages.productId, productId));
  await db
    .delete(productVariants)
    .where(eq(productVariants.productId, productId));

  for (const variant of seed.variants) {
    const variantRow: NewProductVariantRow = {
      productId,
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes,
      priceNowInPaise: variant.priceNowInPaise,
      priceWasInPaise: variant.priceWasInPaise,
      stock: variant.stock,
      isDefault: variant.isDefault ?? false,
      sortOrder: variant.sortOrder,
    };
    const [inserted] = await db
      .insert(productVariants)
      .values(variantRow)
      .returning({ id: productVariants.id });

    if (variant.images.length > 0) {
      const rows: NewProductImageRow[] = variant.images.map((img) => ({
        productId,
        variantId: inserted.id,
        imageKey: img.imageKey,
        alt: img.alt,
        sortOrder: img.sortOrder,
      }));
      await db.insert(productImages).values(rows);
    }
  }

  if (seed.sharedImages.length > 0) {
    const sharedRows: NewProductImageRow[] = seed.sharedImages.map((img) => ({
      productId,
      variantId: null,
      imageKey: img.imageKey,
      alt: img.alt,
      sortOrder: img.sortOrder,
    }));
    await db.insert(productImages).values(sharedRows);
  }
}

async function upsertBlogs(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const post of blogSeeds) {
    const [result] = await db
      .insert(blogPosts)
      .values(post)
      .onConflictDoUpdate({
        target: blogPosts.slug,
        set: {
          title: post.title,
          excerpt: post.excerpt,
          coverImageKey: post.coverImageKey,
          contentMarkdown: post.contentMarkdown,
          authorName: post.authorName,
          readingMinutes: post.readingMinutes,
          isPublished: post.isPublished,
          publishedAt: post.publishedAt,
          updatedAt: new Date(),
        },
      })
      .returning({ id: blogPosts.id, slug: blogPosts.slug });
    map.set(result.slug, result.id);
  }
  return map;
}

async function linkProductBlogs(
  productId: string,
  blogMap: Map<string, string>,
  slugs: string[],
): Promise<void> {
  await db
    .delete(productBlogSections)
    .where(eq(productBlogSections.productId, productId));
  if (slugs.length === 0) return;
  const rows = slugs
    .map((slug, idx) => {
      const blogPostId = blogMap.get(slug);
      if (!blogPostId) return null;
      return { productId, blogPostId, sortOrder: idx };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (rows.length > 0) {
    await db.insert(productBlogSections).values(rows);
  }
}

async function betterAuthHash(password: string): Promise<string> {
  const { scrypt, randomBytes } = await import("node:crypto");
  const { promisify } = await import("node:util");
  const scryptAsync = promisify(scrypt) as (
    password: string | Buffer,
    salt: string | Buffer,
    keylen: number,
    options: object,
  ) => Promise<Buffer>;
  const saltHex = randomBytes(16).toString("hex");
  const key = await scryptAsync(password.normalize("NFKC"), saltHex, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  });
  return `${saltHex}:${key.toString("hex")}`;
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("  ↷ admin seed skipped (ADMIN_EMAIL/ADMIN_PASSWORD missing)");
    return;
  }

  const normalized = email.trim().toLowerCase();

  const existing = await sql`SELECT id FROM neon_auth."user" WHERE email = ${normalized} LIMIT 1`;
  if (existing.length > 0) {
    await sql`UPDATE neon_auth."user" SET role = 'admin' WHERE email = ${normalized}`;
    console.log(`  ↷ admin ${normalized} already exists — role ensured`);
    return;
  }

  const passwordHash = await betterAuthHash(password);

  await sql`
    WITH new_user AS (
      INSERT INTO neon_auth."user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Owner', ${normalized}, true, 'admin', NOW(), NOW())
      RETURNING id
    )
    INSERT INTO neon_auth.account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    SELECT gen_random_uuid(), ${normalized}, 'credential', id, ${passwordHash}, NOW(), NOW()
    FROM new_user
  `;

  console.log(`  ✓ admin ${normalized}`);
}

async function main() {
  console.log(`Seeding ${blogSeeds.length} blog posts…`);
  const blogMap = await upsertBlogs();
  for (const slug of blogMap.keys()) console.log(`  ✓ blog ${slug}`);

  console.log(`Seeding ${productSeeds.length} products with variants…`);
  for (const seed of productSeeds) {
    const productId = await upsertProduct(seed);
    await upsertVariantsAndImages(productId, seed);
    await linkProductBlogs(productId, blogMap, seed.blogSlugs);
    console.log(
      `  ✓ ${seed.slug} (${seed.variants.length} variants, ${seed.blogSlugs.length} blog links)`,
    );
  }

  console.log("Seeding admin…");
  await seedAdmin();

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
