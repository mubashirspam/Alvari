import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle, Package, Truck, Home, RefreshCw, XCircle } from "lucide-react";
import {
  findByShortCode,
  findItemsByOrderId,
} from "@/features/orders/repositories/order-repository";
import {
  mapOrder,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_FLOW,
  ORDER_TYPE_LABEL,
} from "@/features/orders/types";
import { formatINR } from "@/lib/utils";
import { siteConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

const STATUS_ICON: Record<string, React.ElementType> = {
  pending: Package,
  confirmed: CheckCircle2,
  in_production: RefreshCw,
  shipped: Truck,
  delivered: Home,
  cancelled: XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  in_production: "text-purple-600 bg-purple-50 border-purple-200",
  shipped: "text-indigo-600 bg-indigo-50 border-indigo-200",
  delivered: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const orderRow = await findByShortCode(shortCode.toUpperCase());
  if (!orderRow) notFound();

  const itemRows = await findItemsByOrderId(orderRow.id);
  const order = mapOrder(orderRow, itemRows);

  const waNumber = siteConfig.whatsappNumber.replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Hi Alvari! 🌿\n\nOrder #${order.shortCode}\n\n` +
      order.items
        .map((it) => `• ${it.productName}${it.variantName ? ` (${it.variantName})` : ""} × ${it.quantity} — ${formatINR(it.lineTotal)}`)
        .join("\n") +
      `\n\nTotal: ${formatINR(order.total)}\n\nName: ${order.customerName}\nPhone: ${order.customerPhone}\nAddress: ${order.shippingAddress}\n\nPlease confirm and guide me on next steps.`,
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  const progressSteps = ORDER_STATUS_FLOW;
  const currentIdx = progressSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          {order.status === "cancelled" ? (
            <XCircle className="mx-auto mb-3 h-14 w-14 text-red-500" strokeWidth={1.5} />
          ) : (
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-green-500" strokeWidth={1.5} />
          )}
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            {order.status === "cancelled"
              ? "Order Cancelled"
              : order.type === "instant"
                ? order.status === "pending_payment"
                  ? "Order Created"
                  : "Payment Received!"
                : order.type === "quote"
                  ? "Quote Requested!"
                  : "Order Placed!"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Order #{order.shortCode} ·{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* Status + mode badges */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLOR[order.status] ?? "text-[var(--color-muted)] bg-[var(--color-bg-soft)] border-[var(--color-line)]"}`}
            >
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
              {ORDER_TYPE_LABEL[order.type]}
            </span>
          </div>
        </div>

        {/* Progress tracker (not shown for cancelled) */}
        {order.status !== "cancelled" && (
          <div className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
            <div className="relative flex justify-between">
              {/* Connecting line */}
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-[var(--color-line)]" />
              <div
                className="absolute left-0 top-4 h-0.5 bg-[var(--color-accent)] transition-all"
                style={{
                  width: `${currentIdx < 0 ? 0 : (currentIdx / (progressSteps.length - 1)) * 100}%`,
                }}
              />

              {progressSteps.map((step, i) => {
                const Icon = STATUS_ICON[step] ?? Package;
                const done = currentIdx >= i;
                const active = currentIdx === i;
                return (
                  <div key={step} className="relative flex flex-col items-center gap-2">
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        done
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                          : "border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-muted)]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "animate-pulse" : ""}`} />
                    </div>
                    <span
                      className={`text-center text-[10px] leading-tight ${
                        done ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-muted)]"
                      }`}
                    >
                      {ORDER_STATUS_LABEL[step]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-4 font-serif text-xl text-[var(--color-ink)]">Items ordered</h2>
          <ul className="divide-y divide-[var(--color-line)]">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                {item.imageUrl && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-[var(--color-muted)]">{item.variantName}</p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {formatINR(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-[var(--color-line)] pt-4 flex justify-between">
            <span className="text-sm text-[var(--color-muted)]">
              {order.type === "quote" && order.quotedTotal == null
                ? "Estimated total"
                : "Total"}
            </span>
            <span className="font-serif text-xl font-semibold text-[var(--color-ink)]">
              {formatINR(order.total)}
            </span>
          </div>
          {order.type === "quote" && order.quotedTotal == null && (
            <p className="mt-1 text-right text-xs text-[var(--color-muted)]">
              Final price confirmed by our team before payment.
            </p>
          )}
        </div>

        {/* Delivery info */}
        <div className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
          <h2 className="mb-3 font-serif text-xl text-[var(--color-ink)]">Delivery to</h2>
          <p className="text-sm text-[var(--color-muted)]">{order.customerName}</p>
          <p className="text-sm text-[var(--color-muted)]">{order.shippingAddress}</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{order.customerPhone}</p>
        </div>

        {/* Next steps — depends on how the order was placed */}
        {order.status !== "cancelled" &&
          (order.type === "instant" ? (
            <div className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 text-center">
              <h3 className="font-serif text-lg text-[var(--color-ink)]">
                {order.status === "pending_payment"
                  ? "Payment pending"
                  : "You're all set"}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {order.status === "pending_payment"
                  ? "Your payment didn't complete. If money was deducted it will be auto-refunded; otherwise just place the order again."
                  : "Your payment is confirmed — our team starts processing right away and will keep you updated. Questions? We're one message away:"}
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:border-[#25D366] hover:text-[#25D366]"
              >
                <MessageCircle className="h-4 w-4" />
                Chat with us
              </a>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-[#25D366]/30 bg-[#f0fdf4] p-6 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#25D366]" />
              <h3 className="font-serif text-lg text-[var(--color-ink)]">
                {order.type === "quote"
                  ? "Next — we confirm your price"
                  : "Next step — confirm on WhatsApp"}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {order.type === "quote"
                  ? "Our team reviews your order and contacts you on WhatsApp with the final price. Once you approve, we send a secure payment link — nothing is charged until then."
                  : "Our team will contact you within 2–4 hours. You can also reach us directly:"}
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" />
                Message on WhatsApp
              </a>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                50% advance to confirm production · balance at delivery
              </p>
            </div>
          ))}

        {/* Notes */}
        {order.notes && (
          <div className="mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
              Your notes
            </p>
            <p className="mt-2 text-sm text-[var(--color-ink)]">{order.notes}</p>
          </div>
        )}

        {/* Bottom links */}
        <div className="flex flex-col items-center gap-3 text-center text-sm">
          <p className="text-[var(--color-muted)]">
            Save your order number:{" "}
            <span className="font-mono font-semibold text-[var(--color-ink)]">
              {order.shortCode}
            </span>
          </p>
          <Link
            href="/products"
            className="text-[var(--color-muted)] underline underline-offset-2 hover:text-[var(--color-ink)]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
