import Link from "next/link";
import { getRecentEnquiries } from "@/features/admin/repositories/stats-repository";
import { CATEGORY_LABEL } from "@/features/products/types";
import { siteConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const rows = await getRecentEnquiries(100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Enquiries
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {rows.length} most recent · tap phone to call, WhatsApp to message.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          No enquiries yet. The contact form on your site will deliver leads
          here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Looking for</th>
                <th className="px-4 py-3 text-left font-medium">Variant</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">When</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const digits = row.phone.replace(/\D/g, "");
                const waLink = `https://wa.me/${digits || siteConfig.whatsappNumber}`;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--color-line)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink)]">
                      {row.phone}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {row.location ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink)]">
                      {CATEGORY_LABEL[row.productCategory]}
                      {row.productSlug ? (
                        <div className="text-xs text-[var(--color-muted)]">
                          {row.productSlug}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)]">
                      {row.productVariantSku ?? "—"}
                    </td>
                    <td className="max-w-[260px] px-4 py-3 text-xs text-[var(--color-muted)]">
                      {row.notes ?? "—"}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${row.phone}`}
                          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                        >
                          Call
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/admin"
        className="inline-block text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
