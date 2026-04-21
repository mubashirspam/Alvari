"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: { email: string; name: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-bg-soft)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-10">
            <Link
              href="/admin"
              className="font-serif text-xl tracking-tight text-[var(--color-ink)]"
            >
              Alvari · admin
            </Link>
            <nav className="flex items-center gap-6">
              {NAV.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-sm transition-colors",
                      active
                        ? "text-[var(--color-ink)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-[var(--color-muted)] md:inline">
              {admin.name ?? admin.email}
            </span>
            <form action={adminLogout}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-10 md:px-10">
        {children}
      </main>
    </div>
  );
}
