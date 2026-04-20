import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

if (!env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local before running database operations.",
  );
}

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export { schema };
