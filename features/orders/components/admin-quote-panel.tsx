"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, IndianRupee, Link2, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/lib/utils";
import type { OrderStatus } from "@/features/orders/types";

type Props = {
  orderId: string;
  status: OrderStatus;
  customerPhone: string;
  shortCode: string;
  quotedTotal: number | null;
  adminNote: string | null;
};

/**
 * Quote-flow controls on the admin order detail page:
 * enquiry → set quote amount → approve (creates Razorpay payment link) →
 * share the link over WhatsApp.
 */
export function AdminQuotePanel({
  orderId,
  status,
  customerPhone,
  shortCode,
  quotedTotal,
  adminNote,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(quotedTotal ? String(quotedTotal) : "");
  const [note, setNote] = useState(adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function saveQuote() {
    const rupees = Number(amount.replace(/[₹,\s]/g, ""));
    if (!Number.isFinite(rupees) || rupees <= 0) {
      setError("Enter a valid quote amount in rupees.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotedTotalRupees: rupees, adminNote: note || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save the quote");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not approve");
        return;
      }
      setPaymentLink(data.paymentLinkUrl as string);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!paymentLink) return;
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const waShareHref = paymentLink
    ? `https://wa.me/${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi! Your Alvari quote for order #${shortCode} is ready: ${formatINR(Number(amount) || quotedTotal || 0)}. Pay securely here: ${paymentLink}`,
      )}`
    : null;

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
      <h2 className="flex items-center gap-2 font-serif text-lg text-[var(--color-ink)]">
        <IndianRupee className="h-4 w-4" /> Quote
      </h2>

      {status === "enquiry" || status === "quoted" ? (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="quote-amount">Final amount (₹)</Label>
            <Input
              id="quote-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 48500"
              inputMode="decimal"
            />
          </div>
          <div>
            <Label htmlFor="quote-note">Note to record (optional)</Label>
            <Textarea
              id="quote-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What the quote covers, delivery terms…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveQuote}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-xs text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {status === "enquiry" ? "Save quote" : "Update quote"}
            </button>
            {status === "quoted" && (
              <button
                type="button"
                onClick={approve}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ink)] px-5 py-2.5 text-xs text-[var(--color-ink)] transition hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:opacity-50"
              >
                <Link2 className="h-3.5 w-3.5" />
                Approve & create payment link
              </button>
            )}
          </div>
          {status === "quoted" && quotedTotal !== null && (
            <p className="text-xs text-[var(--color-muted)]">
              Current quote: <strong>{formatINR(quotedTotal)}</strong>
            </p>
          )}
        </div>
      ) : quotedTotal !== null ? (
        <p className="mt-3 text-sm text-[var(--color-ink)]">
          Quoted at <strong>{formatINR(quotedTotal)}</strong>
          {adminNote ? <span className="block text-xs text-[var(--color-muted)]">{adminNote}</span> : null}
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          No quote on this order.
        </p>
      )}

      {paymentLink && (
        <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Payment link
          </p>
          <p className="mt-1 break-all font-mono text-xs text-[var(--color-ink)]">{paymentLink}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-4 py-1.5 text-[11px] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            {waShareHref && (
              <a
                href={waShareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-1.5 text-[11px] font-medium text-white hover:opacity-90"
              >
                <Send className="h-3 w-3" /> Send on WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
    </section>
  );
}
