"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";

type PromoCode = {
  id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minOrderInPaise: number;
  maxUsages: number | null;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "flat",
    discountValue: "",
    minOrderRupees: "",
    maxUsages: "",
    expiresAt: "",
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    setPromos(await res.json());
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) { setFormError("Code and discount are required."); return; }
    setCreating(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderRupees: form.minOrderRupees ? Number(form.minOrderRupees) : 0,
          maxUsages: form.maxUsages ? Number(form.maxUsages) : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error ?? "Failed to create");
      } else {
        setForm({ code: "", discountType: "percent", discountValue: "", minOrderRupees: "", maxUsages: "", expiresAt: "" });
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
    await load();
  }

  const inputCls = "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">Promo Codes</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Create discount codes for customers.</p>
      </div>

      {/* Create form */}
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
        <h2 className="mb-5 font-serif text-xl text-[var(--color-ink)]">New promo code</h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Code</label>
            <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Discount type</label>
            <select value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as "percent" | "flat" }))} className={inputCls}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat (₹)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Value ({form.discountType === "percent" ? "%" : "₹"})
            </label>
            <input type="number" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === "percent" ? "10" : "500"} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Min order (₹)</label>
            <input type="number" value={form.minOrderRupees} onChange={(e) => setForm((p) => ({ ...p, minOrderRupees: e.target.value }))} placeholder="0" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Max usages (blank = unlimited)</label>
            <input type="number" value={form.maxUsages} onChange={(e) => setForm((p) => ({ ...p, maxUsages: e.target.value }))} placeholder="∞" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">Expires</label>
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))} className={inputCls} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-60">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create code
            </button>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
        </form>
      </section>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" /></div>
      ) : promos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-line)] p-10 text-center text-sm text-[var(--color-muted)]">No promo codes yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Discount</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Min order</th>
                <th className="px-4 py-3 text-center font-medium">Used</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id} className={`border-t border-[var(--color-line)] ${!p.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      <span className="font-mono font-semibold text-[var(--color-ink)]">{p.code}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">
                    {p.discountType === "percent"
                      ? `${p.discountValue}% off`
                      : `₹${fmt(p.discountValue / 100)} off`}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--color-muted)]">
                    {p.minOrderInPaise > 0 ? `₹${fmt(p.minOrderInPaise / 100)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--color-muted)]">
                    {p.usageCount}{p.maxUsages ? `/${p.maxUsages}` : ""}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--color-muted)]">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive && (
                      <button onClick={() => handleDeactivate(p.id)} className="text-[var(--color-muted)] hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
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
