"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Static labels for known route segments under /admin.
const SEGMENT_LABELS: Record<string, string> = {
  orders: "Orders",
  products: "Products",
  "category-tree": "Categories",
  categories: "Categories",
  banners: "Banners",
  collections: "Collections",
  blog: "Blog",
  reviews: "Reviews",
  measurements: "Measurements",
  enquiries: "Enquiries",
  promos: "Promos",
  analytics: "Analytics",
  "variant-attributes": "Variant attributes",
  new: "New",
  variants: "Variants",
  images: "Images",
  blogs: "Blog sections",
};

type BreadcrumbActions = {
  register: (segment: string, label: string) => void;
  unregister: (segment: string) => void;
};

// Two contexts so BreadcrumbLabel's effect can depend on stable actions only —
// a single context object would change identity on every label registration
// and re-trigger the effect, looping register/unregister forever.
const BreadcrumbLabelsContext = createContext<Record<string, string>>({});
const BreadcrumbActionsContext = createContext<BreadcrumbActions | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const register = useCallback((segment: string, label: string) => {
    setLabels((prev) =>
      prev[segment] === label ? prev : { ...prev, [segment]: label },
    );
  }, []);

  const unregister = useCallback((segment: string) => {
    setLabels((prev) => {
      if (!(segment in prev)) return prev;
      const next = { ...prev };
      delete next[segment];
      return next;
    });
  }, []);

  const actions = useMemo(() => ({ register, unregister }), [register, unregister]);

  return (
    <BreadcrumbActionsContext.Provider value={actions}>
      <BreadcrumbLabelsContext.Provider value={labels}>
        {children}
      </BreadcrumbLabelsContext.Provider>
    </BreadcrumbActionsContext.Provider>
  );
}

/**
 * Rendered by pages with dynamic segments (e.g. /admin/products/[id]) to show
 * the real entity name in the breadcrumb trail instead of the raw id.
 */
export function BreadcrumbLabel({
  segment,
  label,
}: {
  segment: string;
  label: string;
}) {
  const actions = useContext(BreadcrumbActionsContext);
  useEffect(() => {
    if (!actions) return;
    actions.register(segment, label);
    return () => actions.unregister(segment);
  }, [actions, segment, label]);
  return null;
}

// UUIDs / numeric ids get an ellipsis until the page registers a real label.
function looksLikeId(segment: string) {
  return /^[0-9a-f-]{16,}$/i.test(segment) || /^\d+$/.test(segment);
}

function humanize(segment: string) {
  const decoded = decodeURIComponent(segment).replace(/-/g, " ");
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const labels = useContext(BreadcrumbLabelsContext);

  const segments = pathname.split("/").filter(Boolean).slice(1); // drop "admin"

  const crumbs = [
    { href: "/admin", label: "Dashboard", isHome: true },
    ...segments.map((segment, i) => ({
      href: "/admin/" + segments.slice(0, i + 1).join("/"),
      label:
        SEGMENT_LABELS[segment] ??
        labels[segment] ??
        (looksLikeId(segment) ? "…" : humanize(segment)),
      isHome: false,
    })),
  ];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]/60"
                  aria-hidden
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-[var(--color-ink)]"
                >
                  {crumb.isHome ? (
                    <span className="flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5" aria-hidden />
                      {crumb.label}
                    </span>
                  ) : (
                    crumb.label
                  )}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="flex shrink-0 items-center gap-1.5 text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                >
                  {crumb.isHome ? (
                    <>
                      <Home className="h-3.5 w-3.5" aria-hidden />
                      <span className="hidden sm:inline">{crumb.label}</span>
                    </>
                  ) : (
                    crumb.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
