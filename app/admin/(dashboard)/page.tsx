import Link from "next/link";
import {
  getAdminCounts,
  getRecentEnquiries,
} from "@/features/admin/repositories/stats-repository";
import { CATEGORY_LABEL } from "@/features/products/types";

export const dynamic = "force-dynamic";

type StatCard = {
  label: string;
  primary: string;
  secondary?: string;
  href: string;
};

export default async function AdminDashboardPage() {
  const [counts, recent] = await Promise.all([
    getAdminCounts(),
    getRecentEnquiries(8),
  ]);

  const cards: StatCard[] = [
    {
      label: "Products",
      primary: `${counts.activeProducts}`,
      secondary: `${counts.products} total · ${counts.variants} variants`,
      href: "/admin/products",
    },
    {
      label: "Blog posts",
      primary: `${counts.publishedPosts}`,
      secondary: `${counts.blogPosts} total`,
      href: "/admin/blog",
    },
    {
      label: "Open enquiries",
      primary: `${counts.enquiriesOpen}`,
      secondary: `${counts.enquiriesTotal} all-time`,
      href: "/admin/enquiries",
    },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Snapshot of your storefront and customer interest.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 transition-colors hover:border-[var(--color-accent)]"
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {card.label}
            </p>
            <p className="mt-3 font-serif text-[40px] leading-none text-[var(--color-ink)]">
              {card.primary}
            </p>
            {card.secondary && (
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {card.secondary}
              </p>
            )}
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-[22px] text-[var(--color-ink)]">
            Recent enquiries
          </h2>
          <Link
            href="/admin/enquiries"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-line)] p-8 text-center text-sm text-[var(--color-muted)]">
            No enquiries yet. When the form on your site is submitted, leads
            will appear here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Looking for</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--color-line)] text-[var(--color-ink)]"
                  >
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                    <td className="px-4 py-3">
                      {CATEGORY_LABEL[row.productCategory]}
                      {row.productSlug ? (
                        <span className="ml-2 text-xs text-[var(--color-muted)]">
                          · {row.productSlug}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                      {row.status}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                      {new Date(row.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
