import { siteConfig } from "@/lib/env";
import { getAllProducts } from "@/features/products/services/product-service";
import { CATEGORY_LABEL } from "@/features/products/types";

// Long-form companion to /llms.txt: one factual paragraph per product so AI
// assistants can answer detailed questions (material, dimensions, price range,
// variants, warranty) and link straight to the product page.
export const revalidate = 3600;

function base(): string {
  return siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
}

function priceRange(p: Awaited<ReturnType<typeof getAllProducts>>[number]): string {
  const prices = p.variants.length > 0 ? p.variants.map((v) => v.priceNow) : [p.priceNow];
  const low = Math.round(Math.min(...prices));
  const high = Math.round(Math.max(...prices));
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return low === high ? fmt(low) : `${fmt(low)}–${fmt(high)}`;
}

export async function GET(): Promise<Response> {
  const b = base();

  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    products = (await getAllProducts()).filter((p) => p.isActive);
  } catch {
    // DB unreachable — serve header only.
  }

  const lines: string[] = [
    `# ${siteConfig.name} — full catalog`,
    "",
    `Direct-from-factory furniture, built in ${siteConfig.location} and delivered`,
    `across ${siteConfig.serviceArea}. Order on WhatsApp ${siteConfig.displayNumber}.`,
    "",
  ];

  for (const p of products) {
    const inStock = p.variants.some((v) => v.stock > 0) || p.variants.length === 0;
    const facts: string[] = [
      `Category: ${CATEGORY_LABEL[p.category]}`,
      `Price: ${priceRange(p)}`,
    ];
    if (p.material) facts.push(`Material: ${p.material}`);
    if (p.dimensions) facts.push(`Dimensions: ${p.dimensions}`);
    if (p.variants.length > 1) facts.push(`Variants: ${p.variants.length}`);
    if (p.warrantyMonths > 0) facts.push(`Warranty: ${p.warrantyMonths} months`);
    facts.push(`Availability: ${inStock ? "in stock" : "made to order"}`);

    lines.push(
      `## ${p.name}`,
      `URL: ${b}/products/${p.slug}`,
      facts.join(" · "),
      (p.longDescription ?? p.description).replace(/\s+/g, " ").trim(),
      "",
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
