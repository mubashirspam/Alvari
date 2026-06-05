"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { useCart, cartSubtotal } from "@/features/cart/store";
import { formatINR } from "@/lib/utils";
import {
  CustomOrderSection,
  type CustomOrderData,
} from "@/features/orders/components/custom-order-section";

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
  id,
  label,
  required,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]"
      >
        {label}
        {required && <span className="ml-1 text-[var(--color-accent)]">*</span>}
      </label>
      {children}
      {error && <p className="mt-0.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

function Input({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  autoComplete,
  error,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  autoComplete?: string;
  error?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      autoComplete={autoComplete}
      className={`w-full rounded-xl border bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-accent)] ${
        error
          ? "border-red-400 bg-red-50/30"
          : "border-[var(--color-line)] hover:border-[var(--color-muted)]"
      }`}
    />
  );
}

const CUSTOM_EMPTY: CustomOrderData = {
  isCustom: false,
  dimensions: "",
  woodType: "",
  finish: "",
  timeline: "",
  referenceImages: [],
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, setQuantity, remove, clear, hasHydrated } = useCart();
  const [form, setForm] = useState<FormData>(INIT);
  const [customOrder, setCustomOrder] = useState<CustomOrderData>(CUSTOM_EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountRupees: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const set = (k: keyof FormData) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const subtotal = cartSubtotal(items);
  const discount = promoApplied?.discountRupees ?? 0;
  const total = Math.max(0, subtotal - discount);

  // Read referral code from cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/alvari_ref=([A-Za-z0-9_-]+)/);
    if (match?.[1]) setReferralCode(match[1]);
  }, []);

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch(
        `/api/promo/validate?code=${encodeURIComponent(promoInput.trim())}&total=${subtotal}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? "Invalid code");
        setPromoApplied(null);
      } else {
        setPromoApplied({ code: data.code, discountRupees: data.discountRupees, label: data.label });
      }
    } finally {
      setPromoLoading(false);
    }
  }

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
      errs.customerName = "Please enter your full name";
    const phone = form.customerPhone.replace(/\D/g, "");
    if (phone.length < 10) errs.customerPhone = "Please enter a valid 10-digit WhatsApp number";
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      errs.customerEmail = "Please enter a valid email address";
    if (!form.addressLine.trim() || form.addressLine.trim().length < 5)
      errs.addressLine = "Please enter your house / building name or number";
    if (!form.city.trim()) errs.city = "Please enter your city or town";
    if (!form.district.trim()) errs.district = "Please enter your district";
    if (!/^\d{6}$/.test(form.pincode.replace(/\D/g, "")))
      errs.pincode = "Please enter a valid 6-digit pincode";
    if (items.length === 0) errs.items = "Your cart is empty";
    setErrors(errs);

    // Scroll to first error field
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`field-${firstKey}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    }

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
          referralCode: referralCode || null,
          promoCode: promoApplied?.code ?? null,
          discountInPaise: Math.round(discount * 100),
          isCustomOrder: customOrder.isCustom,
          customDimensions: customOrder.dimensions || null,
          customWoodType: customOrder.woodType || null,
          customFinish: customOrder.finish || null,
          customTimeline: customOrder.timeline || null,
          customReferenceImages: customOrder.referenceImages,
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

        <form ref={formRef} onSubmit={handleSubmit} noValidate autoComplete="on">
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
                    <Field id="field-customerName" label="Full name" required error={errors.customerName}>
                      <Input
                        id="field-customerName"
                        value={form.customerName}
                        onChange={set("customerName")}
                        placeholder="Full name"
                        autoComplete="name"
                        error={!!errors.customerName}
                      />
                    </Field>
                  </div>
                  <Field id="field-customerPhone" label="WhatsApp number" required error={errors.customerPhone}>
                    <div className="flex">
                      <span className="flex items-center rounded-l-xl border border-r-0 border-[var(--color-line)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-muted)]">
                        +91
                      </span>
                      <input
                        id="field-customerPhone"
                        type="tel"
                        value={form.customerPhone}
                        onChange={(e) => set("customerPhone")(e.target.value)}
                        placeholder="WhatsApp number"
                        inputMode="tel"
                        maxLength={15}
                        autoComplete="tel-national"
                        name="tel"
                        className={`w-full rounded-r-xl border bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-accent)] ${
                          errors.customerPhone
                            ? "border-red-400 bg-red-50/30"
                            : "border-[var(--color-line)] hover:border-[var(--color-muted)]"
                        }`}
                      />
                    </div>
                    {errors.customerPhone && (
                      <p className="mt-0.5 text-xs font-medium text-red-500">{errors.customerPhone}</p>
                    )}
                  </Field>
                  <Field id="field-customerEmail" label="Email (optional)" error={errors.customerEmail}>
                    <Input
                      id="field-customerEmail"
                      type="email"
                      value={form.customerEmail}
                      onChange={set("customerEmail")}
                      placeholder="Email address"
                      autoComplete="email"
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
                    <Field id="field-addressLine" label="House / Building / Street" required error={errors.addressLine}>
                      <Input
                        id="field-addressLine"
                        value={form.addressLine}
                        onChange={set("addressLine")}
                        placeholder="House number, building name, street"
                        autoComplete="address-line1"
                        error={!!errors.addressLine}
                      />
                    </Field>
                  </div>
                  <Field id="field-pincode" label="Pincode" required error={errors.pincode}>
                    <Input
                      id="field-pincode"
                      value={form.pincode}
                      onChange={set("pincode")}
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                      error={!!errors.pincode}
                    />
                  </Field>
                  <Field id="field-city" label="City / Town" required error={errors.city}>
                    <Input
                      id="field-city"
                      value={form.city}
                      onChange={set("city")}
                      placeholder="City or town"
                      autoComplete="address-level2"
                      error={!!errors.city}
                    />
                  </Field>
                  <Field id="field-district" label="District" required error={errors.district}>
                    <Input
                      id="field-district"
                      value={form.district}
                      onChange={set("district")}
                      placeholder="District"
                      autoComplete="address-level1"
                      error={!!errors.district}
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      id="field-state"
                      value={form.state}
                      onChange={set("state")}
                      placeholder="State"
                      autoComplete="address-level1"
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
                  id="field-notes"
                  value={form.notes}
                  onChange={(e) => set("notes")(e.target.value)}
                  placeholder="Special requirements, delivery instructions, preferred timeline…"
                  rows={3}
                  maxLength={2000}
                  autoComplete="off"
                  className="w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition-colors focus:border-[var(--color-accent)] hover:border-[var(--color-muted)]"
                />
              </section>

              {/* Custom order */}
              <CustomOrderSection value={customOrder} onChange={setCustomOrder} />
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

                {/* Promo code */}
                <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                  {promoApplied ? (
                    <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-mono font-semibold text-green-700">{promoApplied.code}</span>
                        <span className="ml-2 text-green-600">{promoApplied.label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setPromoApplied(null); setPromoInput(""); }}
                        className="text-green-500 hover:text-red-500 transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                        placeholder="Promo code"
                        className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-xs font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] disabled:opacity-50"
                      >
                        {promoLoading ? "…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {promoError && <p className="mt-1 text-xs text-red-500">{promoError}</p>}
                </div>

                {/* Totals */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-muted)]">Subtotal</span>
                    <span className="text-[var(--color-ink)]">{formatINR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-semibold text-green-600">−{formatINR(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-1.5 text-sm">
                    <span className="font-semibold text-[var(--color-ink)]">Total</span>
                    <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">{formatINR(total)}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)]">
                    Delivery charges confirmed by our team.
                  </p>
                </div>
                {referralCode && (
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Referral: <span className="font-mono font-medium">{referralCode}</span>
                  </p>
                )}

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
