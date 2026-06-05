import {
  findByEmail,
  updateLastLogin,
} from "@/features/admin/repositories/admin-repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { admins, type AdminRow } from "@/lib/db/schema";

export type LoginResult =
  | { ok: true; admin: AdminRow; token: string; expiresAt: Date }
  | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
  userAgent: string | null,
): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  let admin = await findByEmail(normalized);

  // Bootstrap: if no admin record exists yet, auto-create from env vars on first login.
  // This handles the case where the DB is fresh and the seed hasn't been run.
  if (!admin) {
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPass = process.env.ADMIN_PASSWORD;
    if (
      envEmail &&
      envPass &&
      normalized === envEmail &&
      password === envPass
    ) {
      const passwordHash = await hashPassword(envPass);
      const [created] = await db
        .insert(admins)
        .values({ email: normalized, passwordHash, name: "Owner", role: "owner" })
        .returning();
      if (!created) return { ok: false, error: "Invalid email or password" };
      admin = created;
    } else {
      return { ok: false, error: "Invalid email or password" };
    }
  } else {
    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return { ok: false, error: "Invalid email or password" };
    }
  }

  const { token, expiresAt } = await createSession(admin.id, userAgent);
  await updateLastLogin(admin.id);
  return { ok: true, admin, token, expiresAt };
}
