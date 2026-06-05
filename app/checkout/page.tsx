"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { useCart, cartSubtotal } from "@/features/cart/store";
import { formatINR } from "@/lib/utils";

type FormData = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  notes: string;
};

const INIT: FormData = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  addressLine: "",
  city: "",
  district: "",
  state: "Kerala",
  pincode: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof FormData | "items" | "root", string>>;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
        {label}
        {required && <span className="ml-1 text-[var(--color-accent)]">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      className={`w-full rounded-xl border bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-accent)] ${
        error
          ? "border-red-400"
          : "border-[var(--color-line)] hover:border-[var(--color-muted)]"
      }`}
    />
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, setQuantity, remove, clear, hasHydrated } = useCart();
  const [form, setForm] = useState<FormData>(INIT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof FormData) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const subtotal = cartSubtotal(items);

  // Auto-lookup city/state from pincode
  useEffect(() => {
    const pin = form.pincode.replace(/\D/g, "");
    if (pin.length !== 6) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        const info = data?.[0]?.PostOffice?.[0];
        if (info) {
          setForm((p) => ({
            ...p,
            city: p.city || info.District,
            district: p.district || info.District,
            state: info.State || p.state,
          }));
        }
      } catch {
        // Pincode lookup is best-effort
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.pincode]);

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!form.customerName.trim() || form.customerName.trim().length < 2)
      errs.customerName = "Enter your full name";
    const phone = form.customerPhone.replace(/\D/g, "");
    if (phone.length < 10) errs.customerPhone = "Enter a valid 10-digit number";
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      errs.customerEmail = "Enter a valid email";
    if (!form.addressLine.trim() || form.addressLine.trim().length < 5)
      errs.addressLine = "Enter your house / building name or number";
    if (!form.city.trim()) errs.city = "Enter your city or town";
    if (!form.district.trim()) errs.district = "Enter your district";
    if (!/^\d{6}$/.test(form.pincode.replace(/\D/g, "")))
      errs.pincode = "Enter a valid 6-digit pincode";
    if (items.length === 0) errs.items = "Your cart is empty";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerPhone: form.customerPhone.replace(/\D/g, ""),
          customerEmail: form.customerEmail || null,
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            productSlug: it.slug,
            productName: it.name,
            variantSku: it.variantSku,
            variantName: it.variantName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            imageUrl: it.imageUrl,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ root: data.error ?? "Something went wrong. Please try again." });
        setSubmitting(false);
        return;
      }

      const { shortCode } = await res.json();
      clear();
      router.push(`/orders/${shortCode}`);
    } catch {
      setErrors({ root: "Network error. Please try again." });
      setSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-[var(--color-muted)]" strokeWidth={1} />
        <div>
          <h1 className="font-serif text-2xl text-[var(--color-ink)]">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Add some products before checking out.
          </p>
        </div>
        <Link
          href="/products"
          className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Back */}
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <h1 className="mb-8 font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* ── Left: Delivery details ── */}
            <div className="space-y-8">
              {/* Contact */}
              <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
                <h2 className="mb-5 font-serif text-xl text-[var(--color-ink)]">
                  Your details
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Full name" required error={errors.customerName}>
                      <Input
                        value={form.customerName}
                        onChange={set("customerName")}
                        placeholder="Eg: Rajan Pillai"
                        error={!!errors.customerName}
                      />
                    </Field>
                  </div>
                  <Field label="WhatsApp number" required error={errors.customerPhone}>
                    <div className="flex">
                      <span className="flex items-center rounded-l-xl border border-r-0 border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-muted)]">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => set("customerPhone")(e.target.value)}
                        placeholder="9400 123456"
                        inputMode="tel"
                        maxLength={15}
                        className={`w-full rounded-r-xl border bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-accent)] ${
                          errors.customerPhone
                            ? "border-red-400"
                            : "border-[var(--color-line)] hover:border-[var(--color-muted)]"
                        }`}
                      />
                    </div>
                    {errors.customerPhone && (
                      <p className="mt-1 text-xs text-red-500">{errors.customerPhone}</p>
                    )}
                  </Field>
                  <Field label="Email (optional)" error={errors.customerEmail}>
                    <Input
                      type="email"
                      value={form.customerEmail}
                      onChange={set("customerEmail")}
                      placeholder="For order confirmation"
                      error={!!errors.customerEmail}
                    />
                  </Field>
                </div>
              </section>

              {/* Address */}
              <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
                <h2 className="mb-5 font-serif text-xl text-[var(--color-ink)]">
                  Delivery address
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="House / Building / Street" required error={errors.addressLine}>
                      <Input
                        value={form.addressLine}
                        onChange={set("addressLine")}
                        placeholder="House no., building name, street"
                        error={!!errors.addressLine}
                      />
                    </Field>
                  </div>
                  <Field label="Pincode" required error={errors.pincode}>
                    <Input
                      value={form.pincode}
                      onChange={set("pincode")}
                      placeholder="673121"
                      inputMode="numeric"
                      maxLength={6}
                      error={!!errors.pincode}
                    />
                  </Field>
                  <Field label="City / Town" required error={errors.city}>
                    <Input
                      value={form.city}
                      onChange={set("city")}
                      placeholder="Kalpetta"
                      error={!!errors.city}
                    />
                  </Field>
                  <Field label="District" required error={errors.district}>
                    <Input
                      value={form.district}
                      onChange={set("district")}
                      placeholder="Wayanad"
                      error={!!errors.district}
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      value={form.state}
                      onChange={set("state")}
                      placeholder="Kerala"
                    />
                  </Field>
                </div>
              </section>

              {/* Notes */}
              <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
                <h2 className="mb-5 font-serif text-xl text-[var(--color-ink)]">
                  Order notes
                  <span className="ml-2 text-sm font-sans font-normal text-[var(--color-muted)]">
                    optional
                  </span>
                </h2>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="Any special requirements — dimensions, wood type, colour preference, delivery instructions…"
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-accent)] hover:border-[var(--color-muted)]"
                />
              </section>
            </div>

            {/* ── Right: Order summary ── */}
            <div className="space-y-4">
              <section className="sticky top-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
                <h2 className="mb-5 font-serif text-xl text-[var(--color-ink)]">
                  Your order
                </h2>

                {errors.items && (
                  <p className="mb-3 text-sm text-red-500">{errors.items}</p>
                )}

                <ul className="divide-y divide-[var(--color-line)]">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-3 py-4">
                      {item.imageUrl && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className="text-xs text-[var(--color-muted)]">{item.variantName}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]">
                            <button
                              type="button"
                              onClick={() => setQuantity(item.key, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(item.key, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[var(--color-ink)]">
                              {formatINR(item.unitPrice * item.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() => remove(item.key)}
                              className="text-[var(--color-muted)] transition-colors hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted)]">Subtotal</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {formatINR(subtotal)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Delivery charges will be confirmed by our team.
                  </p>
                </div>

                {errors.root && (
                  <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {errors.root}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-4 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
                  Our team will contact you on WhatsApp to confirm details and payment.
                </p>
              </section>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
