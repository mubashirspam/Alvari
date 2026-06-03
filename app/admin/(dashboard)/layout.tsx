import { redirect } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Alvari" };

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dual auth: accept a Neon Auth session or the legacy DB-backed admin cookie —
  // the same check every server action / API route uses via requireAdmin().
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell admin={{ email: admin.email, name: admin.name ?? null }}>
      {children}
    </AdminShell>
  );
}
