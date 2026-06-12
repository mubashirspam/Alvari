import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth, ADMIN_ROLES } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";

export type LoginResult = { ok: true } | { ok: false; error: string };

const INVALID = "Invalid email or password";

/**
 * First-run bootstrap: if the DB has no account for the configured ADMIN_EMAIL
 * and the supplied credentials match the env owner, create the owner via Better
 * Auth and elevate the role. Idempotent and a no-op once the owner exists.
 */
async function bootstrapOwnerIfNeeded(email: string, password: string): Promise<void> {
  const envEmail = env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!envEmail || !env.ADMIN_PASSWORD) return;
  if (email !== envEmail || password !== env.ADMIN_PASSWORD) return;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) return;

  await auth.api.signUpEmail({ body: { email, password, name: "Owner" } });
  await db
    .update(users)
    .set({ role: "owner", emailVerified: true })
    .where(eq(users.email, email));
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();

  await bootstrapOwnerIfNeeded(normalized, password);

  // Gate on role before authenticating: customers must not reach the panel.
  const [account] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  if (!account) return { ok: false, error: INVALID };
  if (!(ADMIN_ROLES as readonly string[]).includes(account.role)) {
    return { ok: false, error: "This account doesn't have admin access." };
  }

  // Validate the password and establish the session (nextCookies sets the cookie).
  try {
    await auth.api.signInEmail({
      body: { email: normalized, password },
      headers: await headers(),
    });
  } catch {
    return { ok: false, error: INVALID };
  }

  return { ok: true };
}
