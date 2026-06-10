import { NextRequest, NextResponse } from "next/server";
import {
  findById,
  updateStatus,
} from "@/features/orders/repositories/order-repository";
import * as paymentRepo from "@/features/payments/repositories/payment-repository";
import { canTransition } from "@/lib/commerce/status";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import type { PaymentRow } from "@/lib/db/schema";

type WebhookEvent = {
  event: string;
  payload: {
    payment?: { entity?: { id?: string; order_id?: string } };
    payment_link?: { entity?: { id?: string } };
  };
};

/**
 * Razorpay webhook — signature is verified against the RAW body.
 * Handles payment.captured (instant checkout) and payment_link.paid (quote
 * flow). Idempotent: replaying an event is a no-op once captured.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let payment: PaymentRow | null = null;
  let paidStatus: "paid" | "confirmed";

  if (event.event === "payment.captured") {
    const rzpOrderId = event.payload.payment?.entity?.order_id;
    if (!rzpOrderId) return NextResponse.json({ ok: true, ignored: "no order_id" });
    payment = await paymentRepo.findByRazorpayOrderId(rzpOrderId);
    paidStatus = "paid"; // instant flow
  } else if (event.event === "payment_link.paid") {
    const linkId = event.payload.payment_link?.entity?.id;
    if (!linkId) return NextResponse.json({ ok: true, ignored: "no link id" });
    payment = await paymentRepo.findByPaymentLinkId(linkId);
    paidStatus = "confirmed"; // quote flow: approved → confirmed on payment
  } else {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  if (!payment) {
    // Not one of ours (or created outside this system) — acknowledge so
    // Razorpay stops retrying, but log for investigation.
    console.warn(`[webhooks/razorpay] no payment row for event ${event.event}`);
    return NextResponse.json({ ok: true, ignored: "unknown payment" });
  }

  if (payment.status === "captured") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const razorpayPaymentId = event.payload.payment?.entity?.id;
  await paymentRepo.markStatus(payment.id, "captured", razorpayPaymentId);

  const order = await findById(payment.orderId);
  if (order && canTransition(order.status, paidStatus)) {
    await updateStatus(order.id, paidStatus);
  }

  return NextResponse.json({ ok: true });
}
