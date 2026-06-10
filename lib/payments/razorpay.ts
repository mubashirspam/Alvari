import { createHmac, timingSafeEqual } from "node:crypto";
import { env, siteConfig } from "@/lib/env";

/**
 * Razorpay over plain REST (basic auth) — no SDK dependency.
 * Amounts are always integer paise and always come from the DB order,
 * never from the client.
 */

const RZP_BASE = "https://api.razorpay.com/v1";

export function razorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

function authHeader(): string {
  if (!razorpayConfigured()) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }
  return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
}

async function rzp<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${RZP_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as T & {
    error?: { code?: string; description?: string };
  };
  if (!res.ok) {
    throw new Error(
      `Razorpay ${path} failed (${res.status}): ${json.error?.description ?? "unknown error"}`,
    );
  }
  return json;
}

/* ── instant checkout flow ─────────────────────────────────────────────── */

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

/** Creates a Razorpay Order for the instant-checkout flow. */
export async function createRazorpayOrder(args: {
  amountInPaise: number;
  receipt: string; // our order shortCode
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  return rzp<RazorpayOrder>("/orders", {
    amount: args.amountInPaise,
    currency: "INR",
    receipt: args.receipt,
    notes: args.notes ?? {},
  });
}

/* ── quote flow (payment links over WhatsApp) ──────────────────────────── */

export type RazorpayPaymentLink = {
  id: string;
  short_url: string;
  amount: number;
  status: string;
};

/** Creates a Payment Link for an admin-approved quote. */
export async function createPaymentLink(args: {
  amountInPaise: number;
  referenceId: string; // our order shortCode
  description: string;
  customer: { name: string; contact: string; email?: string | null };
}): Promise<RazorpayPaymentLink> {
  return rzp<RazorpayPaymentLink>("/payment_links", {
    amount: args.amountInPaise,
    currency: "INR",
    reference_id: args.referenceId,
    description: args.description,
    customer: {
      name: args.customer.name,
      contact: args.customer.contact,
      ...(args.customer.email ? { email: args.customer.email } : {}),
    },
    notify: { sms: false, email: false }, // links are shared manually via WhatsApp
    reminder_enable: false,
    callback_url: `${siteConfig.url}/orders/${args.referenceId}`,
    callback_method: "get",
  });
}

/* ── signature verification ────────────────────────────────────────────── */

function safeEqualHex(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(actual, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Verifies the signature Razorpay Checkout returns on the client. */
export function verifyCheckoutSignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
    .digest("hex");
  try {
    return safeEqualHex(expected, args.signature);
  } catch {
    return false;
  }
}

/** Verifies the X-Razorpay-Signature header against the RAW request body. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  try {
    return safeEqualHex(expected, signature);
  } catch {
    return false;
  }
}
