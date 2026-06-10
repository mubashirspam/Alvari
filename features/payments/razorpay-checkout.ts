"use client";

/** Loads checkout.js once and opens Razorpay Checkout. Client-only. */

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.onload = () => resolve();
    el.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment window"));
    };
    document.body.appendChild(el);
  });
  return scriptPromise;
}

export async function openRazorpayCheckout(args: {
  keyId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  prefill?: { name?: string; contact?: string; email?: string };
  onSuccess: (response: RazorpayHandlerResponse) => void;
  onDismiss: () => void;
}): Promise<void> {
  await loadScript();
  if (!window.Razorpay) throw new Error("Payment window unavailable");
  const rzp = new window.Razorpay({
    key: args.keyId,
    order_id: args.razorpayOrderId,
    amount: args.amountInPaise,
    currency: "INR",
    name: "Alvari Furniture",
    description: "Direct-from-factory furniture",
    prefill: args.prefill ?? {},
    theme: { color: "#8B5E3C" },
    handler: args.onSuccess,
    modal: { ondismiss: args.onDismiss },
  });
  rzp.open();
}
