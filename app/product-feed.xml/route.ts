import { siteConfig } from "@/lib/env";
import { buildImageKitUrl } from "@/lib/imagekit";
import { getAllProducts } from "@/features/products/services/product-service";
import {
  CATEGORY_LABEL,
  type Product,
  type ProductVariant,
} from "@/features/products/types";
import { GOOGLE_PRODUCT_CATEGORY } from "@/lib/seo/google-taxonomy";

// RSS 2.0 Google Shopping feed for Google Merchant Center free listings.
// Emits one <item> per sellable variant (grouped via g:item_group_id), or one
// item for products with no variants. Refreshed hourly via ISR.
export const revalidate = 3600;

function base(): string {
  return siteConfig.url.endsWith("/") ? siteConfig.url.slice(0, -1) : siteConfig.url;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function clamp(text: string, max = 5000): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function priceTag(rupees: number): string {
  return `${rupees.toFixed(2)} INR`;
}

function imageUrls(p: Product): string[] {
  const keys = p.images.map((img) => img.imageKey);
  const fallback = p.imageUrl ?? p.illustrationKey;
  if (keys.length === 0 && fallback) keys.push(fallback);
  return keys.map((key) => buildImageKitUrl(key, { width: 1200, format: "auto" }));
}

function item(
  p: Product,
  opts: { id: string; price: number; inStock: boolean; groupId?: string; titleSuffix?: string },
): string {
  const b = base();
  const link = `${b}/products/${p.slug}`;
  const [primaryImage, ...extraImages] = imageUrls(p);
  const title = clamp(`${p.name}${opts.titleSuffix ? ` – ${opts.titleSuffix}` : ""}`, 150);
  const description = clamp(p.longDescription ?? p.description);

  const parts: string[] = [
    "    <item>",
    `      <g:id>${esc(opts.id)}</g:id>`,
    opts.groupId ? `      <g:item_group_id>${esc(opts.groupId)}</g:item_group_id>` : "",
    `      <g:title>${esc(title)}</g:title>`,
    `      <g:description>${esc(description)}</g:description>`,
    `      <g:link>${esc(link)}</g:link>`,
    primaryImage ? `      <g:image_link>${esc(primaryImage)}</g:image_link>` : "",
    ...extraImages
      .slice(0, 10)
      .map((url) => `      <g:additional_image_link>${esc(url)}</g:additional_image_link>`),
    `      <g:availability>${opts.inStock ? "in_stock" : "backorder"}</g:availability>`,
    `      <g:price>${priceTag(opts.price)}</g:price>`,
    `      <g:brand>${esc(p.brand)}</g:brand>`,
    `      <g:mpn>${esc(opts.id)}</g:mpn>`,
    "      <g:condition>new</g:condition>",
    `      <g:google_product_category>${esc(GOOGLE_PRODUCT_CATEGORY[p.category])}</g:google_product_category>`,
    `      <g:product_type>${esc(CATEGORY_LABEL[p.category])}</g:product_type>`,
    "      <g:shipping>",
    "        <g:country>IN</g:country>",
    `        <g:region>${esc(siteConfig.address.region)}</g:region>`,
    "        <g:price>0.00 INR</g:price>",
    "      </g:shipping>",
    "    </item>",
  ];

  return parts.filter(Boolean).join("\n");
}

export async function GET(): Promise<Response> {
  const b = base();

  let products: Product[] = [];
  try {
    products = (await getAllProducts()).filter((p) => p.isActive);
  } catch {
    // DB unreachable — return an empty-but-valid feed rather than 500.
  }

  const items: string[] = [];
  for (const p of products) {
    if (p.variants.length > 0) {
      for (const v of p.variants as ProductVariant[]) {
        items.push(
          item(p, {
            id: v.sku,
            price: v.priceNow,
            inStock: v.stock > 0,
            groupId: p.id,
            titleSuffix: v.name && v.name !== p.name ? v.name : undefined,
          }),
        );
      }
    } else {
      items.push(item(p, { id: p.id, price: p.priceNow, inStock: true }));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(siteConfig.name)}</title>
    <link>${esc(b)}</link>
    <description>Factory-direct furniture, delivered across Kerala.</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
