"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Package, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth/client";
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

type OrderItem = {
  productName: string;
  variantName: string | null;
  quantity: number;
  lineTotal: number;
};
type Order = {
  shortCode: string;
  total: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
  items: OrderItem[];
};

export default function AccountOrdersPage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const user = session?.user;
  // A guest who checked out holds an anonymous session. Treat them as signed-out
  // here so they're still offered Google sign-in, which links their anonymous
  // orders onto the real account (see onLinkAccount in lib/auth).
  const isSignedIn = Boolean(user) && !user?.isAnonymous;

  useEffect(() => {
    if (!isSignedIn) return;
    setOrdersLoading(true);
    fetch("/api/user/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [isSignedIn]);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/account/orders",
    });
  }

  async function handleSignOut() {
    await authClient.signOut({ fetchOptions: { onSuccess: () => window.location.reload() } });
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  // Not signed in (or only an anonymous guest session) — show sign-in screen.
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-12">
        <div className="mx-auto max-w-md px-4 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-[var(--color-accent)]" strokeWidth={1.5} />
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            My Orders
          </h1>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Sign in with Google to see orders placed with your email address.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-[var(--color-line)] bg-white px-6 py-3.5 text-sm font-medium text-[var(--color-ink)] shadow-sm transition-all hover:border-[var(--color-accent)] hover:shadow disabled:opacity-60"
          >
            {signingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="mt-6 border-t border-[var(--color-line)] pt-6">
            <p className="text-sm text-[var(--color-muted)]">
              Placed an order without signing in?
            </p>
            <Link
              href="/orders/lookup"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
            >
              Track by phone number →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Signed in (isSignedIn guarantees a real, non-anonymous user here).
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-10">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
              My Orders
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {user.name ?? user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        {/* Orders */}
        {ordersLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" />
          </div>
        ) : orders === null || orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-[var(--color-muted)]" strokeWidth={1} />
            <p className="text-sm text-[var(--color-muted)]">
              No orders found for{" "}
              <span className="font-medium text-[var(--color-ink)]">{user.email}</span>.
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Orders show here only if you entered this email at checkout.
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <Link
                href="/orders/lookup"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Track by phone number instead
              </Link>
              <Link
                href="/products"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
              >
                Browse Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--color-muted)]">
              {orders.length} order{orders.length > 1 ? "s" : ""}
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
                      {" · "}
                      {order.shippingAddress.split(",").slice(-2).join(",").trim()}
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

        {/* Phone lookup prompt for signed-in users too */}
        <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-5 text-center">
          <p className="text-xs text-[var(--color-muted)]">
            Placed an order with a different email or without signing in?
          </p>
          <Link
            href="/orders/lookup"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
          >
            Track by phone number →
          </Link>
        </div>
      </div>
    </div>
  );
}
