import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { findById, findItemsByOrderId } from "@/features/orders/repositories/order-repository";
import { mapOrder, ORDER_STATUS_LABEL } from "@/features/orders/types";
import { formatINR } from "@/lib/utils";
import { AdminOrderStatusSelect } from "@/features/orders/components/admin-order-status-select";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderRow = await findById(id);
  if (!orderRow) notFound();

  const itemRows = await findItemsByOrderId(orderRow.id);
  const order = mapOrder(orderRow, itemRows);

  const phone = order.customerPhone.replace(/\D/g, "");
  const waPhone = phone.startsWith("91") ? phone : "91" + phone;
  const waText = encodeURIComponent(
    `Hi ${order.customerName}! Regarding your Alvari order #${order.shortCode}.`,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All orders
          </Link>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Order #{order.shortCode}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "full",
              timeStyle: "short",
            })}
            {" · "}placed via {order.placedVia}
          </p>
        </div>
        <AdminOrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
            <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Items</h2>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                <tr>
                  <th className="pb-3 text-left font-medium">Product</th>
                  <th className="pb-3 text-center font-medium">Qty</th>
                  <th className="pb-3 text-right font-medium">Unit</th>
                  <th className="pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[var(--color-ink)]">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-[var(--color-muted)]">
                              {item.variantName}
                              {item.variantSku && ` · ${item.variantSku}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center text-[var(--color-muted)]">{item.quantity}</td>
                    <td className="py-3 text-right text-[var(--color-muted)]">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-semibold text-[var(--color-ink)]">
                      {formatINR(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--color-line)]">
                  <td colSpan={3} className="pt-4 text-right font-semibold text-[var(--color-muted)]">
                    Total
                  </td>
                  <td className="pt-4 text-right font-serif text-xl font-semibold text-[var(--color-ink)]">
                    {formatINR(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Customer notes
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">{order.notes}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Customer
            </h3>
            <p className="font-medium text-[var(--color-ink)]">{order.customerName}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{order.customerPhone}</p>
            {order.customerEmail && (
              <p className="text-sm text-[var(--color-muted)]">{order.customerEmail}</p>
            )}
            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${order.customerPhone}`}
                className="flex-1 rounded-xl border border-[var(--color-line)] px-3 py-2 text-center text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
              >
                Call
              </a>
              <a
                href={`https://wa.me/${waPhone}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-80"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Delivery address
            </h3>
            <p className="text-sm text-[var(--color-ink)]">{order.shippingAddress}</p>
          </section>

          {/* Order meta */}
          <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Order info
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Short code</dt>
                <dd className="font-mono font-semibold text-[var(--color-ink)]">
                  {order.shortCode}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Status</dt>
                <dd className="font-medium text-[var(--color-ink)]">
                  {ORDER_STATUS_LABEL[order.status]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-muted)]">Placed via</dt>
                <dd className="text-[var(--color-ink)]">{order.placedVia}</dd>
              </div>
              {order.whatsappOpenedAt && (
                <div className="flex justify-between">
                  <dt className="text-[var(--color-muted)]">WA opened</dt>
                  <dd className="text-[var(--color-ink)]">
                    {new Date(order.whatsappOpenedAt).toLocaleDateString("en-IN")}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Track link */}
          <a
            href={`/orders/${order.shortCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-dashed border-[var(--color-line)] p-3 text-center text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
          >
            Customer tracking link ↗
          </a>
        </div>
      </div>
    </div>
  );
}
