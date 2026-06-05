"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, Package, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/features/orders/types";

const STATUS_COLOR: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  confirmed: "text-blue-600 bg-blue-50",
  in_production: "text-purple-600 bg-purple-50",
  shipped: "text-indigo-600 bg-indigo-50",
  delivered: "text-green-600 bg-green-50",
  cancelled: "text-red-600 bg-red-50",
};

type Order = {
  shortCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; variantName: string | null; quantity: number; lineTotal: number }>;
};

export default function OrderLookupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid 10-digit WhatsApp number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/lookup?phone=${digits}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setOrders(null);
      } else {
        setOrders(data.orders);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12">
      <div className="mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-[var(--color-accent)]" strokeWidth={1.5} />
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Track your order
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Enter the WhatsApp number you used when placing the order.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="flex flex-1">
              <span className="flex items-center rounded-l-xl border border-r-0 border-[var(--color-line)] bg-[var(--color-bg-soft)] px-3 text-sm text-[var(--color-muted)]">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9400 123456"
                inputMode="tel"
                maxLength={15}
                className="w-full rounded-r-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-5 py-3 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </form>

        {/* Results */}
        {orders !== null && (
          <>
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-10 text-center">
                <p className="text-sm text-[var(--color-muted)]">
                  No orders found for this number.
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Try a different number, or{" "}
                  <Link
                    href="/products"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    browse our products
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-muted)]">
                  {orders.length} order{orders.length > 1 ? "s" : ""} found
                </p>
                {orders.map((order) => (
                  <Link
                    key={order.shortCode}
                    href={`/orders/${order.shortCode}`}
                    className="block rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5 transition-colors hover:border-[var(--color-accent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                            #{order.shortCode}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLOR[order.status] ?? "text-gray-600 bg-gray-50"}`}
                          >
                            {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                          {order.items
                            .map((it) => `${it.productName} ×${it.quantity}`)
                            .join(", ")}
                        </p>
                        <p className="mt-2 text-xs text-[var(--color-muted)]">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold text-[var(--color-ink)]">
                          {formatINR(order.total)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sign-in prompt */}
        <div className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            Want to save your orders to an account?
          </p>
          <Link
            href="/account/orders"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-5 py-2.5 text-sm text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
          >
            Sign in with Google
          </Link>
        </div>
      </div>
    </div>
  );
}
