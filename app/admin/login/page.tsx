import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata = { title: "Admin sign in · Alvari" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6 py-16">
      <AdminLoginForm />
    </main>
  );
}
