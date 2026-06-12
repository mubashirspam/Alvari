import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAnonymous: boolean;
};

/** Returns the signed-in Better Auth user (any role) — or null if not signed in. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const u = session?.user;
    if (!u?.email || !u?.id) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      image: u.image ?? null,
      isAnonymous: Boolean((u as { isAnonymous?: boolean }).isAnonymous),
    };
  } catch {
    return null;
  }
}
