"use server";

import { redirect } from "next/navigation";
import { neonAuth } from "@/lib/auth/neon-auth";

export async function adminLogin(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await neonAuth.signIn.email({ email, password });

  if (error) {
    return { error: error.message || "Invalid email or password." };
  }

  redirect("/admin");
}
