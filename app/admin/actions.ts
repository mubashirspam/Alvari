"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export async function adminLogout() {
  // Revoke the Better Auth session (best-effort).
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    // Otherwise swallow — we still clear the legacy cookie below.
  }

  // Clear the legacy DB-cookie session too, so transition logins fully sign out.
  const jar = await cookies();
  try {
    jar.delete(SESSION_COOKIE);
  } catch {
    // ignore
  }

  redirect("/admin/login");
}
