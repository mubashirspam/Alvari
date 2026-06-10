"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Free home-measurement request form (lead magnet). Self-contained — mount
 * anywhere. Posts to /api/measurement-requests.
 */
export function MeasurementRequestForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    area: "",
    preferredSlot: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const honeypot =
        (new FormData(e.currentTarget).get("website") as string) ?? "";
      const res = await fetch("/api/measurement-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: honeypot }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message ?? "Could not submit — please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-8">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="font-medium text-[var(--color-ink)]">Request received!</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Our team will call you to schedule your free home measurement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 md:p-8"
    >
      <h3 className="flex items-center gap-2 font-serif text-[22px] tracking-[-0.02em] text-[var(--color-ink)]">
        <Ruler className="h-5 w-5" /> Book a free home measurement
      </h3>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        We visit, measure your space, and recommend the right pieces — free
        across Kerala.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="mr-name">Your name</Label>
          <Input id="mr-name" value={form.name} onChange={set("name")} autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="mr-phone">Phone</Label>
          <Input id="mr-phone" value={form.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" required />
        </div>
        <div>
          <Label htmlFor="mr-pincode">Pincode</Label>
          <Input id="mr-pincode" value={form.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} required />
        </div>
        <div>
          <Label htmlFor="mr-area">Area / town</Label>
          <Input id="mr-area" value={form.area} onChange={set("area")} placeholder="e.g. Kalpetta" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mr-slot">Preferred day & time</Label>
          <Input id="mr-slot" value={form.preferredSlot} onChange={set("preferredSlot")} placeholder="e.g. Saturday morning" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="mr-note">Anything we should know?</Label>
          <Textarea id="mr-note" value={form.note} onChange={set("note")} rows={3} placeholder="Which rooms, what furniture you're planning…" />
        </div>
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-8 py-3.5 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Request free measurement"
        )}
      </button>
    </form>
  );
}
