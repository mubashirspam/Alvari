import Link from "next/link";
import { getAllBanners } from "@/features/banners/services/banner-service";
import { BANNER_SLOT_LABEL } from "@/features/banners/types";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminBannersPage() {
  const banners = await getAllBanners();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Banners
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {banners.length} banners across all slots. Banners control the hero, promo strips, and mid-page promos on the homepage.
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)]"
        >
          + New banner
        </Link>
      </div>

      {banners.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          No banners yet. Add a hero banner to get started.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Banner</th>
                <th className="px-4 py-3 text-left font-medium">Slot</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {b.imageKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.imageKey}
                          alt=""
                          className="h-12 w-20 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-20 flex-shrink-0 rounded bg-[var(--color-bg-soft)]" />
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">
                          {b.title ?? b.slug}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          /{b.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">
                    {BANNER_SLOT_LABEL[b.slot]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                        b.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-[var(--color-bg-soft)] text-[var(--color-muted)]"
                      }`}
                    >
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">
                    {b.startsAt || b.endsAt ? (
                      <>
                        {b.startsAt ? DATE_FMT.format(b.startsAt) : "now"} —{" "}
                        {b.endsAt ? DATE_FMT.format(b.endsAt) : "always"}
                      </>
                    ) : (
                      "Always"
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{b.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/banners/${b.id}`}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
