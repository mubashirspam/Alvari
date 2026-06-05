import { neonAuth } from "@/lib/auth/neon-auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/** Returns the signed-in Neon Auth user (any role) — or null if not signed in. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await neonAuth.getSession();
    const u = data?.user as
      | { id?: string; email?: string | null; name?: string | null; image?: string | null }
      | undefined;
    if (!u?.email || !u?.id) return null;
    return { id: u.id, email: u.email, name: u.name ?? null, image: u.image ?? null };
  } catch {
    return null;
  }
}
