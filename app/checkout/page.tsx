"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  CreditCard,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import { useCart, cartSubtotal } from "@/features/cart/store";
import type { CartItem } from "@/features/cart/types";
import { openRazorpayCheckout } from "@/features/payments/razorpay-checkout";
import { authClient } from "@/lib/auth/client";
import { partitionCheckout } from "@/lib/commerce/checkout-options";
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

/** A single cart line with quantity controls — shared by both groups. */
function LineItem({
  item,
  priceLabel,
  onSetQty,
  onRemove,
}: {
  item: CartItem;
  priceLabel: React.ReactNode;
  onSetQty: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex gap-3 py-4">
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
              onClick={() => onSetQty(item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onSetQty(item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-right text-sm font-semibold text-[var(--color-ink)]">
              {priceLabel}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="text-[var(--color-muted)] transition-colors hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, setQuantity, remove, removeMany, clear, hasHydrated } = useCart();
  const [form, setForm] = useState<FormData>(INIT);
  const [customOrder, setCustomOrder] = useState<CustomOrderData>(CUSTOM_EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState<"online" | "quote" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountRupees: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  // After one group of a mixed cart is placed, we keep the user here to finish
  // the other group and show this confirmation for the order they just placed.
  const [placed, setPlaced] = useState<{ kind: "online" | "quote"; shortCode: string } | null>(null);

  const set = (k: keyof FormData) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Split the cart into its two checkout paths (mirrored server-side).
  const { online: onlineItems, quote: quoteItems } = partitionCheckout(items);

  const onlineSubtotal = cartSubtotal(onlineItems);
  // Promo discount only applies to the online (money-moving) path; quote
  // prices are finalised by the team, who apply any code manually.
  const discount = Math.min(promoApplied?.discountRupees ?? 0, onlineSubtotal);
  const onlineTotal = Math.max(0, onlineSubtotal - discount);

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
        `/api/promo/validate?code=${encodeURIComponent(promoInput.trim())}&total=${onlineSubtotal}`,
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

  function basePayload(group: CartItem[], discountRupees: number) {
    return {
      ...form,
      customerPhone: form.customerPhone.replace(/\D/g, ""),
      customerEmail: form.customerEmail || null,
      referralCode: referralCode || null,
      promoCode: promoApplied?.code ?? null,
      discountInPaise: Math.round(discountRupees * 100),
      items: group.map((it) => ({
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
    };
  }

  /** Clear the just-placed group; redirect if the cart is now empty, else stay. */
  function afterPlaced(kind: "online" | "quote", group: CartItem[], shortCode: string) {
    const placedKeys = group.map((i) => i.key);
    const cartEmptied = items.every((i) => placedKeys.includes(i.key));
    removeMany(placedKeys);
    if (promoApplied) {
      // Avoid reusing the code on the other group of a mixed cart.
      setPromoApplied(null);
      setPromoInput("");
    }
    if (cartEmptied) {
      clear();
      router.push(`/orders/${shortCode}`);
    } else {
      setPlaced({ kind, shortCode });
      setSubmitting(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function payOnline() {
    const group = onlineItems;
    try {
      const res = await fetch("/api/orders/instant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(basePayload(group, discount)),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({
          root:
            data.error ??
            "Online payment is unavailable right now — try again in a moment.",
        });
        setSubmitting(null);
        return;
      }
      await openRazorpayCheckout({
        keyId: data.keyId,
        razorpayOrderId: data.razorpayOrderId,
        amountInPaise: data.amountInPaise,
        prefill: data.prefill,
        onSuccess: async (resp) => {
          const verifyRes = await fetch("/api/orders/instant/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            const { shortCode } = await verifyRes.json();
            afterPlaced("online", group, shortCode);
          } else {
            setErrors({
              root: "Payment received but confirmation failed — our team will verify and contact you.",
            });
            setSubmitting(null);
          }
        },
        onDismiss: () => {
          setErrors({
            root: "Payment was cancelled — no money was taken. You can try again or request a quote.",
          });
          setSubmitting(null);
        },
      });
    } catch {
      setErrors({ root: "Could not open the payment window. Please try again." });
      setSubmitting(null);
    }
  }

  async function requestQuote() {
    const group = quoteItems;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basePayload(group, 0),
          isCustomOrder: customOrder.isCustom,
          customDimensions: customOrder.dimensions || null,
          customWoodType: customOrder.woodType || null,
          customFinish: customOrder.finish || null,
          customTimeline: customOrder.timeline || null,
          customReferenceImages: customOrder.referenceImages,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ root: data.error ?? "Something went wrong. Please try again." });
        setSubmitting(null);
        return;
      }
      const { shortCode } = await res.json();
      afterPlaced("quote", group, shortCode);
    } catch {
      setErrors({ root: "Network error. Please try again." });
      setSubmitting(null);
    }
  }

  // Make sure a Better Auth session exists (anonymous for guests) before placing
  // the order, so it's stamped with a userId and can migrate to the customer's
  // real account when they later sign in with Google. Best-effort: a failure
  // here just means this order links by email only.
  async function ensureCustomerSession() {
    try {
      const { data } = await authClient.getSession();
      if (!data?.session) {
        await authClient.signIn.anonymous();
      }
    } catch {
      // ignore — order still records the customer's details
    }
  }

  async function handlePayOnline() {
    if (onlineItems.length === 0 || submitting) return;
    setErrors({});
    if (!validate()) return;
    setSubmitting("online");
    await ensureCustomerSession();
    await payOnline();
  }

  async function handleRequestQuote() {
    if (quoteItems.length === 0 || submitting) return;
    setErrors({});
    if (!validate()) return;
    setSubmitting("quote");
    await ensureCustomerSession();
    await requestQuote();
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
        {placed ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={1.5} />
            <div>
              <h1 className="font-serif text-2xl text-[var(--color-ink)]">
                {placed.kind === "online" ? "Payment confirmed" : "Quote request sent"}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Order <span className="font-mono font-medium">{placed.shortCode}</span> is on its way.
              </p>
            </div>
            <Link
              href={`/orders/${placed.shortCode}`}
              className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
            >
              View your order
            </Link>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    );
  }

  const isMixed = onlineItems.length > 0 && quoteItems.length > 0;

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

        <h1 className="mb-2 font-serif text-[32px] tracking-[-0.02em] text-[var(--color-ink)]">
          Checkout
        </h1>
        {isMixed && (
          <p className="mb-6 max-w-2xl text-sm text-[var(--color-muted)]">
            Your cart has two kinds of items. Pay online for the available ones now,
            and request a WhatsApp quote for the made-to-order ones — handle each in
            its own section on the right. You can do both.
          </p>
        )}

        {/* Confirmation for a group already placed (mixed cart, one half done) */}
        {placed && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <p className="font-medium">
                {placed.kind === "online" ? "Payment confirmed" : "Quote request sent"} — order{" "}
                <Link href={`/orders/${placed.shortCode}`} className="font-mono underline">
                  {placed.shortCode}
                </Link>
                .
              </p>
              <p className="mt-0.5 text-green-700">
                Now finish the remaining items below.
              </p>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={(e) => e.preventDefault()} noValidate autoComplete="on">
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

              {/* Custom order — applies to the WhatsApp quote */}
              {quoteItems.length > 0 && (
                <CustomOrderSection value={customOrder} onChange={setCustomOrder} />
              )}
            </div>

            {/* ── Right: Order summary, split by checkout path ── */}
            <div className="space-y-4">
              <div className="sticky top-6 space-y-4">
                {errors.items && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-500">{errors.items}</p>
                )}

                {/* ── Pay online now (available items) ── */}
                {onlineItems.length > 0 && (
                  <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
                    <div className="mb-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--color-accent)]" />
                      <h2 className="font-serif text-xl text-[var(--color-ink)]">
                        Pay online now
                      </h2>
                    </div>
                    <p className="mb-3 text-xs text-[var(--color-muted)]">
                      In stock — UPI, cards & netbanking, secured by Razorpay.
                    </p>

                    <ul className="divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
                      {onlineItems.map((item) => (
                        <LineItem
                          key={item.key}
                          item={item}
                          priceLabel={formatINR(item.unitPrice * item.quantity)}
                          onSetQty={(q) => setQuantity(item.key, q)}
                          onRemove={() => remove(item.key)}
                        />
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
                        <span className="text-[var(--color-ink)]">{formatINR(onlineSubtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600">Discount</span>
                          <span className="font-semibold text-green-600">−{formatINR(discount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-1.5 text-sm">
                        <span className="font-semibold text-[var(--color-ink)]">Total</span>
                        <span className="font-serif text-lg font-semibold text-[var(--color-ink)]">{formatINR(onlineTotal)}</span>
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

                    <button
                      type="button"
                      onClick={handlePayOnline}
                      disabled={submitting !== null}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-4 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting === "online" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Opening payment…
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Pay {formatINR(onlineTotal)}
                        </>
                      )}
                    </button>
                    <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
                      You&apos;ll get an order confirmation right after payment.
                    </p>
                  </section>
                )}

                {/* ── Get a quote (made-to-order items, via WhatsApp) ── */}
                {quoteItems.length > 0 && (
                  <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
                    <div className="mb-1 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[var(--color-accent)]" />
                      <h2 className="font-serif text-xl text-[var(--color-ink)]">
                        Get a quote
                      </h2>
                    </div>
                    <p className="mb-3 text-xs text-[var(--color-muted)]">
                      Made-to-order — our team confirms the final price on WhatsApp,
                      then sends a secure payment link. Nothing is charged until you approve.
                    </p>

                    <ul className="divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
                      {quoteItems.map((item) => (
                        <LineItem
                          key={item.key}
                          item={item}
                          priceLabel={
                            item.priceIsIndicative ? (
                              <span className="text-xs font-medium text-[var(--color-muted)]">
                                Price on confirmation
                              </span>
                            ) : (
                              <span className="flex flex-col items-end leading-tight">
                                <span>{formatINR(item.unitPrice * item.quantity)}</span>
                                <span className="text-[10px] font-normal uppercase tracking-wide text-[var(--color-muted)]">
                                  starting
                                </span>
                              </span>
                            )
                          }
                          onSetQty={(q) => setQuantity(item.key, q)}
                          onRemove={() => remove(item.key)}
                        />
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={handleRequestQuote}
                      disabled={submitting !== null}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-ink)] bg-transparent px-6 py-4 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting === "quote" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending request…
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          Request quote via WhatsApp
                        </>
                      )}
                    </button>
                    <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
                      Our team contacts you on WhatsApp to confirm the final price.
                    </p>
                  </section>
                )}

                {errors.root && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                    {errors.root}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
