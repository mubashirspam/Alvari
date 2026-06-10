import Link from "next/link";
import { adminListMeasurementRequests } from "@/features/measurements/services/measurement-service";
import { MEASUREMENT_STATUS_LABEL } from "@/features/measurements/schema";
import { AdminMeasurementStatusSelect } from "@/features/measurements/components/admin-measurement-status-select";
import type { MeasurementStatus } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DATE_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS: { value: MeasurementStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminMeasurementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.value === status)?.value;
  const requests = await adminListMeasurementRequests(filter);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
            Measurements
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {requests.length} free home-measurement request
            {requests.length === 1 ? "" : "s"} — call to schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const href = f.value
              ? `/admin/measurements?status=${f.value}`
              : "/admin/measurements";
            return (
              <Link
                key={f.label}
                href={href}
                className={`rounded-full border px-4 py-2 text-xs tracking-wide transition ${
                  active
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-12 text-center text-sm text-[var(--color-muted)]">
          No measurement requests{filter ? ` with status "${MEASUREMENT_STATUS_LABEL[filter]}"` : " yet"}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Preferred slot</th>
                <th className="px-4 py-3 text-left font-medium">Requested</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-[var(--color-line)] align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{r.name}</p>
                    <a
                      href={`https://wa.me/${r.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
                    >
                      {r.phone}
                    </a>
                    {r.note && (
                      <p className="mt-1 max-w-[280px] text-xs text-[var(--color-muted)]">{r.note}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">
                    {r.area ? `${r.area}, ` : ""}
                    {r.pincode}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{r.preferredSlot ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {DATE_FMT.format(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminMeasurementStatusSelect requestId={r.id} currentStatus={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
