import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  return {
    rules: [
      // Main rule — all crawlers including Googlebot
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/account"],
      },
      // Explicitly allow known AI crawlers (some check robots.txt)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Gemini", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
