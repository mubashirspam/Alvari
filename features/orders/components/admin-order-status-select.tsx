"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW, type OrderStatus } from "@/features/orders/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  in_production: "bg-purple-50 text-purple-700 border-purple-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
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

  async function handleChange(next: OrderStatus) {
    if (next === status) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
    } finally {
      setSaving(false);
    }
  }

  const allStatuses: OrderStatus[] = [...ORDER_STATUS_FLOW, "cancelled"];

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {saving && <Loader2 className="h-3 w-3 animate-spin text-[var(--color-muted)]" />}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as OrderStatus)}
        disabled={saving}
        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer appearance-none pr-5 disabled:opacity-60 ${STATUS_STYLE[status]}`}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M0 2l4 4 4-4' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
      >
        {allStatuses.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
