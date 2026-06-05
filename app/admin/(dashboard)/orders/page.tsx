import Link from "next/link";
import {
  findAllForAdmin,
  findItemsForOrderIds,
} from "@/features/orders/repositories/order-repository";
import { mapOrder, ORDER_STATUS_LABEL, ORDER_STATUS_FLOW } from "@/features/orders/types";
import { formatINR } from "@/lib/utils";
import { siteConfig } from "@/lib/env";
import { AdminOrderStatusSelect } from "@/features/orders/components/admin-order-status-select";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-400",
  in_production: "bg-purple-400",
  shipped: "bg-indigo-400",
  delivered: "bg-green-400",
  cancelled: "bg-red-400",
};

export default async function AdminOrdersPage() {
  const orderRows = await findAllForAdmin(300);
  const itemsByOrder = await findItemsForOrderIds(orderRows.map((o) => o.id));
  const orders = orderRows.map((row) => mapOrder(row, itemsByOrder.get(row.id) ?? []));

  const counts = ORDER_STATUS_FLOW.reduce(
    (acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pendingTotal = orders
    .filter((o) => o.status === "pending")
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Orders
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {orders.length} orders · {orders.filter((o) => o.status !== "cancelled").length} active
          </p>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ORDER_STATUS_FLOW.map((status) => (
          <div
            key={status}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-3"
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {ORDER_STATUS_LABEL[status]}
              </span>
            </div>
            <p className="mt-2 font-serif text-[28px] leading-none text-[var(--color-ink)]">
              {counts[status] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {pendingTotal > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm">
          <span className="font-semibold text-amber-800">
            {formatINR(pendingTotal)}
          </span>{" "}
          <span className="text-amber-700">pending confirmation</span>
        </div>
      )}

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          No orders yet. Orders placed on the site will appear here.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const phone = order.customerPhone.replace(/\D/g, "");
                const waText = encodeURIComponent(
                  `Hi ${order.customerName}! Regarding your Alvari order #${order.shortCode}.`,
                );
                const waLink = `https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${waText}`;

                return (
                  <tr
                    key={order.id}
                    className="border-t border-[var(--color-line)] hover:bg-[var(--color-bg-soft)]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-[var(--color-accent)] hover:underline"
                      >
                        {order.shortCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-ink)]">{order.customerName}</p>
                      <p className="text-xs text-[var(--color-muted)]">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-[var(--color-muted)] line-clamp-1">
                        {order.items.map((it) => `${it.productName} ×${it.quantity}`).join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-ink)]">
                      {formatINR(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <AdminOrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--color-muted)]">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-80"
                      >
                        WA
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
