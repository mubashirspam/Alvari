"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/features/orders/types";
import { ALLOWED_TRANSITIONS } from "@/lib/commerce/status";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  in_production: "bg-purple-50 text-purple-700 border-purple-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  enquiry: "bg-sky-50 text-sky-700 border-sky-200",
  quoted: "bg-cyan-50 text-cyan-700 border-cyan-200",
  approved: "bg-teal-50 text-teal-700 border-teal-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  ready: "bg-lime-50 text-lime-700 border-lime-200",
};

export function AdminOrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: OrderStatus) {
    if (next === status) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Update failed");
        return;
      }
      setStatus(next);
    } finally {
      setSaving(false);
    }
  }

  // Offer only legal moves (plus the current status) — the API enforces the
  // same transition map and returns 409 on anything else.
  const options: OrderStatus[] = [status, ...(ALLOWED_TRANSITIONS[status] ?? [])];
  const terminal = options.length === 1;

  return (
    <div className="relative inline-flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-1.5">
        {saving && <Loader2 className="h-3 w-3 animate-spin text-[var(--color-muted)]" />}
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as OrderStatus)}
          disabled={saving || terminal}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer appearance-none pr-5 disabled:opacity-60 ${STATUS_STYLE[status]}`}
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M0 2l4 4 4-4' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="max-w-[260px] text-right text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
