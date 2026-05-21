import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// Pick the env file based on DRIZZLE_ENV (set by db:* scripts):
//   staging → .env.staging  (default — current dev workflow)
//   prod    → .env.production
//   anything else → .env.local
const which = process.env.DRIZZLE_ENV ?? "staging";
const envFile =
  which === "prod"
    ? ".env.production"
    : which === "staging"
      ? ".env.staging"
      : ".env.local";

// Load the chosen file first, then fall back to .env / .env.local for anything
// it doesn't define.
loadEnv({ path: envFile });
loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  // eslint-disable-next-line no-console
  console.warn(
    `[drizzle.config] DATABASE_URL is empty after loading ${envFile}. Drizzle commands will fail.`,
  );
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
} satisfies Config;
