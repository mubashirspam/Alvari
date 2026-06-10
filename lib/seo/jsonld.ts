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

/**
 * Google recommends ≥3 product images, ideally in multiple aspect ratios
 * (1:1, 4:3, 16:9). We emit the distinct catalog images we have, then top up
 * to three by deriving aspect-ratio crops of the primary image via ImageKit.
 */
function productImages(product: Product): string[] {
  const keys = product.images.map((img) => img.imageKey);
  const fallback = product.imageUrl ?? product.illustrationKey;
  if (keys.length === 0 && fallback) keys.push(fallback);
  if (keys.length === 0) return [absoluteUrl("/og-default.png")];

  const urls = keys.map((key) => buildImageKitUrl(key, { width: 1200, format: "auto" }));

  if (urls.length < 3) {
    const primary = keys[0];
    const ratios: Array<{ width: number; height: number }> = [
      { width: 1200, height: 1200 }, // 1:1
      { width: 1200, height: 900 }, // 4:3
      { width: 1200, height: 675 }, // 16:9
    ];
    for (const r of ratios) {
      if (urls.length >= 3) break;
      urls.push(buildImageKitUrl(primary, { ...r, format: "auto", focus: "auto" }));
    }
  }

  return urls;
}

function shippingDetails(): JsonLd {
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "IN",
      addressRegion: siteConfig.address.region,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 7,
        maxValue: 21,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  };
}

function returnPolicy(): JsonLd {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory:
      "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };
}

function priceValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
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
    foundingLocation: {
      "@type": "Place",
      name: `${siteConfig.address.locality}, ${siteConfig.address.region}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        postalCode: siteConfig.address.postalCode,
        addressCountry: siteConfig.address.country,
      },
    },
    areaServed: { "@type": "State", name: siteConfig.serviceArea },
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

function googleMapsUrl(): string {
  const { lat, lng } = siteConfig.geo;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function localBusinessJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["FurnitureStore", "LocalBusiness"],
    "@id": `${siteConfig.url}#localbusiness`,
    name: siteConfig.name,
    description:
      "Factory-direct furniture from our Wayanad workshop — wardrobes, beds, sofas, dining sets, and complete room sets. Delivered across Kerala.",
    url: siteConfig.url,
    telephone: `+${siteConfig.whatsappNumber}`,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    image: absoluteUrl("/og-default.png"),
    hasMap: googleMapsUrl(),
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

export type ProductRatingInfo = {
  average: number;
  count: number;
};

export function productJsonLd(
  product: Product,
  rating?: ProductRatingInfo,
): JsonLd {
  const url = absoluteUrl(`/products/${product.slug}`);
  const images = productImages(product);
  const inStock = product.variants.some((v) => v.stock > 0) || product.variants.length === 0;
  const availability = inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/MadeToOrder";

  // Shared offer fields for both Offer and AggregateOffer shapes.
  const offerBase = {
    priceCurrency: "INR",
    availability,
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil: priceValidUntil(),
    url,
    seller: { "@id": `${siteConfig.url}#organization` },
    shippingDetails: shippingDetails(),
    hasMerchantReturnPolicy: returnPolicy(),
  };

  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];

  let offers: JsonLd;
  if (product.variants.length > 1) {
    const prices = product.variants.map((v) => v.priceNow);
    offers = {
      "@type": "AggregateOffer",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: product.variants.length,
      ...offerBase,
    };
  } else {
    offers = {
      "@type": "Offer",
      price: defaultVariant?.priceNow ?? product.priceNow,
      ...offerBase,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.longDescription ?? product.description,
    sku: defaultVariant?.sku ?? product.id,
    mpn: defaultVariant?.sku ?? product.id,
    brand: { "@type": "Brand", name: product.brand },
    category: CATEGORY_LABEL[product.category],
    material: product.material ?? undefined,
    image: images,
    url,
    offers,
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
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

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productListJsonLd(products: Product[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Alvari Furniture — All Products",
    url: absoluteUrl("/products"),
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
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
