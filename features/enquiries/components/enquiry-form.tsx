"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL } from "@/features/products/types";
import { siteConfig } from "@/lib/env";
import type { EnquiryInput } from "@/features/enquiries/schema";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success" };

export function EnquiryForm({
  defaultCategory,
  defaultProductSlug,
}: {
  defaultCategory?: EnquiryInput["productCategory"];
  defaultProductSlug?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: EnquiryInput = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      location: (formData.get("location") as string) || null,
      productCategory: formData.get(
        "productCategory",
      ) as EnquiryInput["productCategory"],
      productSlug: defaultProductSlug ?? null,
      notes: (formData.get("notes") as string) || null,
    };

    setStatus({ kind: "submitting" });

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(body?.message ?? "Something went wrong.");
      }

      setStatus({ kind: "success" });
      (event.target as HTMLFormElement).reset();

      const whatsappMsg =
        `*New Enquiry — Alvari*\n\n` +
        `*Name:* ${payload.name}\n` +
        `*Phone:* ${payload.phone}\n` +
        `*Location:* ${payload.location ?? "—"}\n` +
        `*Looking for:* ${CATEGORY_LABEL[payload.productCategory]}\n` +
        `*Notes:* ${payload.notes ?? "—"}`;
      window.open(
        `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(whatsappMsg)}`,
        "_blank",
        "noopener",
      );
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-[var(--color-bg-soft)] p-8 md:p-11"
    >
      <h3 className="font-serif text-[28px] font-normal tracking-[-0.01em] text-[var(--color-ink)]">
        Send an enquiry
      </h3>
      <p className="mb-7 mt-1 text-sm font-light text-[var(--color-muted)]">
        We&apos;ll call you within 2 hours. Promise.
      </p>

      <div className="mb-4">
        <Label htmlFor="enq-name">Your Name</Label>
        <Input
          id="enq-name"
          name="name"
          placeholder="Full name"
          autoComplete="name"
          required
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="enq-phone">WhatsApp Number</Label>
          <Input
            id="enq-phone"
            name="phone"
            type="tel"
            placeholder="+91"
            autoComplete="tel"
            required
          />
        </div>
        <div>
          <Label htmlFor="enq-location">Location</Label>
          <Input
            id="enq-location"
            name="location"
            placeholder="City, District"
            autoComplete="address-level2"
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="enq-category">What are you looking for?</Label>
        <Select
          id="enq-category"
          name="productCategory"
          defaultValue={defaultCategory ?? ""}
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          {(Object.entries(CATEGORY_LABEL) as [
            EnquiryInput["productCategory"],
            string,
          ][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4">
        <Label htmlFor="enq-notes">Any details? (Optional)</Label>
        <Textarea
          id="enq-notes"
          name="notes"
          placeholder="Dimensions, wood preference, quantity, timeline..."
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "submitting"}
        className="mt-2 w-full rounded-full bg-[var(--color-ink)] px-8 py-4 text-sm uppercase tracking-[0.06em] text-[var(--color-bg)] transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.kind === "submitting" ? "Sending…" : "Send Enquiry →"}
      </button>

      {status.kind === "error" && (
        <p className="mt-3 text-center text-xs text-red-700">
          {status.message}
        </p>
      )}
      {status.kind === "success" && (
        <p className="mt-3 text-center text-xs text-[var(--color-accent)]">
          Thanks — we&apos;ll call you within 2 hours.
        </p>
      )}
      {status.kind !== "success" && status.kind !== "error" && (
        <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
          No payment collected · Response within 2 hours
        </p>
      )}
    </form>
  );
}
