import { siteConfig } from "@/lib/env";
import { buildImageKitUrl } from "@/lib/imagekit";
import type { Product } from "@/features/products/types";
import { CATEGORY_LABEL } from "@/features/products/types";
import type { BlogPost } from "@/features/blog/types";

type JsonLd = Record<string, unknown>;

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

function productImageUrl(product: Product): string {
  const primary = product.images[0]?.imageKey ?? product.imageUrl ?? product.illustrationKey;
  if (!primary) return absoluteUrl("/og-default.png");
  return buildImageKitUrl(primary, { width: 1200, format: "auto" });
}

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: absoluteUrl("/logo.png"),
    sameAs: Object.values(siteConfig.socials),
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: `+${siteConfig.whatsappNumber}`,
        contactType: "sales",
        areaServed: "IN",
        availableLanguage: ["en", "ml"],
      },
    ],
  };
}

export function localBusinessJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${siteConfig.url}#localbusiness`,
    name: siteConfig.name,
    description:
      "Factory-direct furniture from our Wayanad workshop — wardrobes, beds, sofas, dining sets, and complete room sets. Delivered across Kerala.",
    url: siteConfig.url,
    telephone: `+${siteConfig.whatsappNumber}`,
    priceRange: "₹₹",
    image: absoluteUrl("/og-default.png"),
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.lat,
      longitude: siteConfig.geo.lng,
    },
    areaServed: { "@type": "State", name: siteConfig.serviceArea },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    sameAs: Object.values(siteConfig.socials),
  };
}

export function productJsonLd(product: Product): JsonLd {
  const url = absoluteUrl(`/products/${product.slug}`);
  const image = productImageUrl(product);
  const inStock = product.variants.some((v) => v.stock > 0) || product.variants.length === 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.longDescription ?? product.description,
    sku: product.variants[0]?.sku ?? product.id,
    brand: { "@type": "Brand", name: product.brand },
    category: CATEGORY_LABEL[product.category],
    material: product.material ?? undefined,
    image,
    url,
    offers: {
      "@type": "Offer",
      price: product.priceNow,
      priceCurrency: "INR",
      url,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${siteConfig.url}#organization` },
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(
  items: { question: string; answer: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

export function articleJsonLd(post: BlogPost): JsonLd {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const image = post.coverImageKey
    ? buildImageKitUrl(post.coverImageKey, { width: 1200, format: "auto" })
    : absoluteUrl(`/og/blog/${post.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt ?? undefined,
    image,
    url,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.publishedAt?.toISOString(),
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@id": `${siteConfig.url}#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
