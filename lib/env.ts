import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_FOLDER_PREFIX: z.string().optional(),
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  STAGING_PASSWORD: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_ENV_MODE: z.enum(["production", "staging", "development"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_FOLDER_PREFIX: process.env.IMAGEKIT_FOLDER_PREFIX,
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT:
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  AUTH_SECRET: process.env.AUTH_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
  NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  CRON_SECRET: process.env.CRON_SECRET,
  STAGING_PASSWORD: process.env.STAGING_PASSWORD,
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_ENV_MODE: process.env.NEXT_PUBLIC_ENV_MODE,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
});

export type EnvMode = "production" | "staging" | "development";

/**
 * Resolve which environment this process is running in.
 * Order of precedence:
 *   1. NEXT_PUBLIC_ENV_MODE (explicit override, useful for local pointing-at-staging)
 *   2. VERCEL_ENV (production | preview | development) — set by Vercel
 *   3. NODE_ENV (production | development) — fallback
 */
export function envMode(): EnvMode {
  if (env.NEXT_PUBLIC_ENV_MODE) return env.NEXT_PUBLIC_ENV_MODE;
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "staging";
  if (process.env.NODE_ENV === "production") return "production";
  return "development";
}

export const isProd = (): boolean => envMode() === "production";
export const isStaging = (): boolean => envMode() === "staging";

export const siteConfig = {
  name: "Alvari Furniture",
  legalName: "Alvari",
  tagline: "Direct-from-Factory Furniture",
  url: env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsappNumber: env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999",
  displayNumber: "+91 94003 06614",
  location: "Kalpetta, Wayanad — Kerala",
  hours: "Mon–Sat · 9am–8pm",
  address: {
    locality: "Kalpetta",
    region: "Kerala",
    country: "IN",
    postalCode: "673121",
  },
  geo: { lat: 11.6088, lng: 76.0833 },
  founders: ["Alvari"],
  socials: {
    instagram: "https://www.instagram.com/alvari.in_",
    facebook: "https://www.facebook.com/profile.php?id=61590393175389",
    whatsapp: "https://wa.me/919400306614",
  },
  serviceArea: "Kerala",
} as const;
