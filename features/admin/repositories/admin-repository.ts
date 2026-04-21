import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { admins, type AdminRow } from "@/lib/db/schema";

export async function findByEmail(email: string): Promise<AdminRow | null> {
  const rows = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateLastLogin(adminId: string): Promise<void> {
  await db
    .update(admins)
    .set({ lastLoginAt: new Date() })
    .where(eq(admins.id, adminId));
}
