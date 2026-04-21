import { redirect } from "next/navigation";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { neonAuth } from "@/lib/auth/neon-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Alvari" };

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await neonAuth.getSession();

  type AuthUser = NonNullable<typeof session>["user"] & { role?: string | null };
  const user = session?.user as AuthUser | undefined;
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      admin={{ email: user.email, name: user.name ?? null }}
    >
      {children}
    </AdminShell>
  );
}
