import type { ProductCategory } from "@/features/products/types";

// Maps our internal product categories to Google's product taxonomy
// (https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt).
// Used in the Google Merchant Center feed. Approximate matches are fine —
// Google re-classifies on its end, but a close starting point reduces
// disapprovals and improves Shopping placement.
export const GOOGLE_PRODUCT_CATEGORY: Record<ProductCategory, string> = {
  almirah: "Furniture > Cabinets & Storage > Armoires & Wardrobes",
  bed: "Furniture > Beds & Accessories > Beds & Bed Frames",
  sofa: "Furniture > Sofas",
  dining: "Furniture > Kitchen & Dining Room Furniture > Kitchen & Dining Room Sets",
  dressing: "Furniture > Tables > Vanities",
  coffee_table: "Furniture > Tables > Accent Tables > Coffee Tables",
  mattress: "Furniture > Beds & Accessories > Mattresses",
  room_set: "Furniture",
  custom: "Furniture",
  chair: "Furniture > Chairs",
  sideboard: "Furniture > Cabinets & Storage > Sideboards & Buffets",
  table: "Furniture > Tables",
};
