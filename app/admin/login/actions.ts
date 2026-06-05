"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { login } from "@/features/admin/services/admin-service";
import { setSessionCookie } from "@/lib/auth/session";

export async function adminLogin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const headersList = await headers();
  const userAgent = headersList.get("user-agent");

  const result = await login(email, password, userAgent);

  if (!result.ok) {
    return { error: result.error ?? "Invalid email or password." };
  }

  await setSessionCookie(result.token, result.expiresAt);
  redirect("/admin");
}
