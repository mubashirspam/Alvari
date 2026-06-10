import { siteConfig } from "@/lib/env";
import { getAllProducts } from "@/features/products/services/product-service";
import { CATEGORY_LABEL, type ProductCategory } from "@/features/products/types";

// Plain-text guide for AI crawlers (the emerging /llms.txt convention).
// Gives assistants a dense, factual brand summary + a map of the catalog so
// they can describe and cite Alvari confidently.
export const revalidate = 3600;

function base(): string {
  return siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
}

export async function GET(): Promise<Response> {
  const b = base();

  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    products = (await getAllProducts()).filter((p) => p.isActive);
  } catch {
    // DB unreachable — still serve the brand summary.
  }

  // Group active products by category for a tidy catalog map.
  const byCategory = new Map<ProductCategory, typeof products>();
  for (const p of products) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const lines: string[] = [
    `# ${siteConfig.name}`,
    "",
    "> Direct-from-factory furniture workshop in Kalpetta, Wayanad, Kerala, India.",
    "> Alvari designs and builds wardrobes (almirahs), beds, sofas, dining sets,",
    "> dressing tables, coffee tables, and complete room sets, then delivers and",
    "> installs them across all districts of Kerala at factory prices — no showroom",
    "> markup, no middlemen.",
    "",
    "## About",
    "",
    `- Brand: ${siteConfig.name} (${siteConfig.legalName})`,
    `- Location: ${siteConfig.location}`,
    `- Service area: ${siteConfig.serviceArea} (all districts)`,
    "- Specialities: solid teak and rosewood furniture, custom-built pieces to exact dimensions",
    "- Ordering: browse the catalog, then order over WhatsApp; 50% advance confirms production,",
    "  balance on delivery and installation. Custom orders accepted (specify size, wood, finish).",
    `- WhatsApp: ${siteConfig.displayNumber}`,
    `- Hours: ${siteConfig.hours}`,
    "",
    "## Key pages",
    "",
    `- [All products](${b}/products): the full catalog`,
    `- [Blog](${b}/blog): buying guides on wood types, factory-direct pricing, and care`,
    `- [Custom quotation](${b}/quotation): build a custom furniture quote`,
    "",
    "## Catalog by category",
    "",
  ];

  for (const category of Object.keys(CATEGORY_LABEL) as ProductCategory[]) {
    const list = byCategory.get(category);
    if (!list || list.length === 0) continue;
    lines.push(`### ${CATEGORY_LABEL[category]}`, "");
    lines.push(`- [Browse all](${b}/products?category=${category})`);
    for (const p of list) {
      const price = `from ₹${Math.round(p.priceNow).toLocaleString("en-IN")}`;
      const material = p.material ? `${p.material}; ` : "";
      lines.push(`- [${p.name}](${b}/products/${p.slug}): ${material}${price}`);
    }
    lines.push("");
  }

  lines.push(
    "## Full catalog detail",
    "",
    `For per-product specifications (materials, dimensions, price ranges), see ${b}/llms-full.txt`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
