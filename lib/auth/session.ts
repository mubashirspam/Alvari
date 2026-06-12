import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminSessions,
  admins,
  type AdminRow,
  type AdminSessionRow,
} from "@/lib/db/schema";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/auth/constants";
import { auth, ADMIN_ROLES } from "@/lib/auth";

export { SESSION_COOKIE } from "@/lib/auth/constants";

/** Lean view of the signed-in staff member used across the admin surface. */
export type CurrentAdmin = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): { token: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { token: raw, hash: hashToken(raw) };
}

export async function createSession(
  adminId: string,
  userAgent: string | null,
): Promise<{ token: string; expiresAt: Date }> {
  const { token, hash } = generateSessionToken();
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  await db.insert(adminSessions).values({
    adminId,
    tokenHash: hash,
    expiresAt,
    userAgent: userAgent ?? null,
  });
  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await db
    .delete(adminSessions)
    .where(eq(adminSessions.tokenHash, hashToken(token)));
}

export async function findAdminBySessionToken(
  token: string,
): Promise<{ admin: AdminRow; session: AdminSessionRow } | null> {
  const rows = await db
    .select({ admin: admins, session: adminSessions })
    .from(adminSessions)
    .innerJoin(admins, eq(admins.id, adminSessions.adminId))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function getCurrentAdminFromLegacyCookie(): Promise<CurrentAdmin | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await findAdminBySessionToken(token);
  if (!result) return null;
  const { admin } = result;
  return { id: admin.id, email: admin.email, name: admin.name ?? null, role: admin.role };
}

async function getCurrentAdminFromBetterAuth(): Promise<CurrentAdmin | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user?.email || typeof user.role !== "string") return null;
    if (!(ADMIN_ROLES as readonly string[]).includes(user.role)) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the signed-in staff member. Prefers a Better Auth session whose role
 * is one of ADMIN_ROLES; falls back to the legacy DB-cookie session so existing
 * admin logins keep working through the transition. Customers (role
 * "customer") are intentionally rejected here.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const fromBetterAuth = await getCurrentAdminFromBetterAuth();
  if (fromBetterAuth) return fromBetterAuth;
  return getCurrentAdminFromLegacyCookie();
}

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("UNAUTHORIZED");
  }
  return admin;
}
