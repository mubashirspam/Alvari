"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { MeasurementStatus } from "@/lib/db/schema";
import { MEASUREMENT_STATUS_LABEL } from "../schema";

const STATUS_STYLE: Record<MeasurementStatus, string> = {
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const ALL: MeasurementStatus[] = ["requested", "scheduled", "completed", "cancelled"];

export function AdminMeasurementStatusSelect({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: MeasurementStatus;
}) {
  const [status, setStatus] = useState<MeasurementStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: MeasurementStatus) {
    if (next === status) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/measurement-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setStatus(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      {saving && <Loader2 className="h-3 w-3 animate-spin text-[var(--color-muted)]" />}
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as MeasurementStatus)}
        disabled={saving}
        className={`cursor-pointer appearance-none rounded-full border px-2.5 py-1 pr-5 text-[11px] font-semibold outline-none disabled:opacity-60 ${STATUS_STYLE[status]}`}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M0 2l4 4 4-4' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
      >
        {ALL.map((s) => (
          <option key={s} value={s}>
            {MEASUREMENT_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
