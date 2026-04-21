import Link from "next/link";
import { adminFindAllProducts } from "@/features/admin/repositories/product-admin-repository";
import { CATEGORY_LABEL } from "@/features/products/types";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await adminFindAllProducts();

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Products
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {products.length} products — click to edit.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)]"
        >
          + New product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-t border-[var(--color-line)]"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--color-ink)]">{p.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-[var(--color-ink)]">
                  {CATEGORY_LABEL[p.category]}
                </td>
                <td className="px-4 py-3 text-[var(--color-ink)]">
                  {formatINR(p.priceNowInPaise / 100)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
                      p.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-[var(--color-bg-soft)] text-[var(--color-muted)]"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/products/${p.id}/variants`}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                    >
                      Variants
                    </Link>
                    <Link
                      href={`/admin/products/${p.id}/images`}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                    >
                      Images
                    </Link>
                    <Link
                      href={`/admin/products/${p.id}/blogs`}
                      className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                    >
                      Blogs
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
