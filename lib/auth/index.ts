import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, anonymous } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";
import { db } from "@/lib/db";
import { orders, measurementRequests, users } from "@/lib/db/schema";

/**
 * Better Auth runs against a POOLED neon-serverless client (WebSocket) because
 * sign-up wraps user+account creation in a transaction, which the neon-http
 * driver used by the rest of the app does not support. Same DATABASE_URL.
 */
const pool = new Pool({ connectionString: env.DATABASE_URL });
const authDb = drizzle(pool, { schema });

/** Roles that may reach the admin panel (mirrors the old adminRoleEnum). */
export const ADMIN_ROLES = ["owner", "admin", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_SITE_URL,
  secret: env.BETTER_AUTH_SECRET ?? env.AUTH_SECRET,
  database: drizzleAdapter(authDb, {
    provider: "pg",
    usePlural: true,
    schema,
  }),
  // Keep ids as UUIDs so they match users.id and the existing orders.userId FK.
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  // Staff sign in with email + password; customers use Google / anonymous.
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID as string,
          clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  plugins: [
    // Panel access is enforced by our own requireAdmin() against ADMIN_ROLES;
    // the plugin's built-in "admin" role governs only its management endpoints.
    // Finer-grained owner/editor RBAC can be added later via access-control roles.
    admin({
      defaultRole: "customer",
    }),
    anonymous({
      // When a guest (anonymous) user signs in with Google, move their orders
      // and measurement requests onto the real account, then drop the anon row.
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        const anonId = anonymousUser.user.id;
        const newId = newUser.user.id;
        if (!anonId || !newId || anonId === newId) return;
        await db.update(orders).set({ userId: newId }).where(eq(orders.userId, anonId));
        await db
          .update(measurementRequests)
          .set({ userId: newId })
          .where(eq(measurementRequests.userId, anonId));
        await db.delete(users).where(eq(users.id, anonId));
      },
    }),
    // nextCookies must be the LAST plugin so it can flush Set-Cookie headers.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
