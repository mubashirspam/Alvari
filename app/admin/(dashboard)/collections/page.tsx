import Link from "next/link";
import { getAllCollections } from "@/features/collections/services/collection-service";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await getAllCollections();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Collections
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {collections.length} collections — curated product groups shown on the homepage.
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)]"
        >
          + New collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          No collections yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Collection</th>
                <th className="px-4 py-3 text-left font-medium">Featured</th>
                <th className="px-4 py-3 text-left font-medium">Active</th>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.heroImageKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.heroImageKey}
                          alt=""
                          className="h-12 w-20 flex-shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-20 flex-shrink-0 rounded bg-[var(--color-bg-soft)]" />
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-ink)]">{c.title}</p>
                        <p className="text-xs text-[var(--color-muted)]">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                        c.isFeatured
                          ? "bg-amber-100 text-amber-800"
                          : "bg-[var(--color-bg-soft)] text-[var(--color-muted)]"
                      }`}
                    >
                      {c.isFeatured ? "Featured" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                        c.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-[var(--color-bg-soft)] text-[var(--color-muted)]"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/collections/${c.id}`}
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
