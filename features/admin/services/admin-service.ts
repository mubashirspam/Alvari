import {
  findByEmail,
  updateLastLogin,
} from "@/features/admin/repositories/admin-repository";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import type { AdminRow } from "@/lib/db/schema";

export type LoginResult =
  | { ok: true; admin: AdminRow; token: string; expiresAt: Date }
  | { ok: false; error: string };

export async function login(
  email: string,
  password: string,
  userAgent: string | null,
): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const admin = await findByEmail(normalized);
  if (!admin) {
    return { ok: false, error: "Invalid email or password" };
  }
  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return { ok: false, error: "Invalid email or password" };
  }
  const { token, expiresAt } = await createSession(admin.id, userAgent);
  await updateLastLogin(admin.id);
  return { ok: true, admin, token, expiresAt };
}
