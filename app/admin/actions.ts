"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { neonAuth } from "@/lib/auth/neon-auth";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth";
const NEON_AUTH_COOKIE_NAMES = [
  `${NEON_AUTH_COOKIE_PREFIX}.session_token`,
  `${NEON_AUTH_COOKIE_PREFIX}.local.session_data`,
  `${NEON_AUTH_COOKIE_PREFIX}.session_challange`,
  // In dev (http://localhost), the `__Secure-` prefix is dropped — clear both shapes.
  "neon-auth.session_token",
  "neon-auth.local.session_data",
  "neon-auth.session_challange",
];

export async function adminLogout() {
  // Clear cookies first so we always clean up, regardless of signOut outcome.
  const jar = await cookies();
  for (const name of NEON_AUTH_COOKIE_NAMES) {
    try {
      jar.delete(name);
    } catch {
      // ignore
    }
  }
  try {
    jar.delete(SESSION_COOKIE);
  } catch {
    // ignore
  }

  // Attempt remote sign-out (best-effort).
  try {
    await neonAuth.signOut();
  } catch (err) {
    // Re-throw Next.js redirect errors so they aren't swallowed.
    if (isRedirectError(err)) throw err;
    // Otherwise swallow — cookies are already cleared.
  }

  redirect("/admin/login");
}
