"use server";

import { redirect } from "next/navigation";
import { neonAuth } from "@/lib/auth/neon-auth";

export async function adminLogout() {
  await neonAuth.signOut();
  redirect("/admin/login");
}
