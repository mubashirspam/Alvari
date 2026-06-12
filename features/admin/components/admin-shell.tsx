"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  FileText,
  FolderTree,
  GalleryHorizontal,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Ruler,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  TicketPercent,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/app/admin/actions";
import {
  AdminBreadcrumbs,
  BreadcrumbProvider,
} from "@/features/admin/components/admin-breadcrumbs";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/category-tree", label: "Categories", icon: FolderTree },
      { href: "/admin/collections", label: "Collections", icon: Layers },
      { href: "/admin/variant-attributes", label: "Variant attributes", icon: SlidersHorizontal },
      { href: "/admin/banners", label: "Banners", icon: GalleryHorizontal },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/promos", label: "Promos", icon: TicketPercent },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/admin/measurements", label: "Measurements", icon: Ruler },
      { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
    ],
  },
];

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]/80">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-ink)] text-[var(--color-bg)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-muted)]/70 group-hover:text-[var(--color-ink)]",
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ admin }: { admin: { email: string; name: string | null } }) {
  const initial = (admin.name ?? admin.email).charAt(0).toUpperCase();
  return (
    <div className="border-t border-[var(--color-line)] px-3 py-4">
      <div className="flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-sm font-medium text-[var(--color-accent)]">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-ink)]">
            {admin.name ?? "Admin"}
          </p>
          <p className="truncate text-xs text-[var(--color-muted)]">{admin.email}</p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            title="Sign out"
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({
  admin,
  children,
}: {
  admin: { email: string; name: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever navigation happens (state adjustment
  // during render instead of an effect, per react-hooks/set-state-in-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center border-b border-[var(--color-line)] px-6">
        <Link
          href="/admin"
          className="font-serif text-lg tracking-tight text-[var(--color-ink)]"
        >
          Alvari <span className="text-[var(--color-muted)]">· admin</span>
        </Link>
      </div>
      <SidebarNav pathname={pathname} />
      <SidebarFooter admin={admin} />
    </>
  );

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen bg-[var(--color-bg)]">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-bg-soft)] lg:flex">
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-[var(--color-ink)]/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[var(--color-bg-soft)] shadow-xl">
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        <div className="lg:pl-64">
          {/* Top bar: mobile menu + breadcrumbs */}
          <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/90 backdrop-blur">
            <div className="flex h-14 items-center gap-3 px-4 md:px-8">
              <button
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <AdminBreadcrumbs />
              <div className="ml-auto">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  View store
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">
            {children}
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
