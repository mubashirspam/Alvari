import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  // Paths that should never be indexed: admin, APIs, and transactional/
  // session-specific pages (cart-aware or per-visitor result pages).
  const disallow = ["/admin", "/api", "/account", "/checkout", "/orders/lookup"];

  // Search + AI-answer crawlers we explicitly welcome. Listing each one (rather
  // than relying on the "*" rule) makes intent unambiguous and survives any
  // future tightening of the wildcard rule.
  const allowedBots = [
    "Googlebot",
    "Googlebot-Image",
    "Bingbot",
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "Applebot",
    "Applebot-Extended",
    "CCBot",
    "meta-externalagent",
  ];

  return {
    rules: [
      // Main rule — every other crawler.
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Named search + AI crawlers: same access, stated explicitly.
      ...allowedBots.map((userAgent) => ({ userAgent, allow: "/", disallow })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
