import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  findById,
  findItemsByOrderId,
  updateStatus,
} from "@/features/orders/repositories/order-repository";
import { mapOrder } from "@/features/orders/types";
import * as paymentRepo from "@/features/payments/repositories/payment-repository";
import { canTransition } from "@/lib/commerce/status";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-email";
import { env } from "@/lib/env";

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/** Marks an instant order paid after verifying the checkout signature. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }
  const { razorpayOrderId, razorpayPaymentId, signature } = parsed.data;

  if (!verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, signature })) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const payment = await paymentRepo.findByRazorpayOrderId(razorpayOrderId);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const order = await findById(payment.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotent: a webhook may have captured it first.
  if (payment.status !== "captured") {
    await paymentRepo.markStatus(payment.id, "captured", razorpayPaymentId);
  }
  if (canTransition(order.status, "paid")) {
    await updateStatus(order.id, "paid");
    const items = await findItemsByOrderId(order.id);
    void sendOrderConfirmationEmail(
      mapOrder({ ...order, status: "paid" }, items),
      env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    );
  }

  return NextResponse.json({ shortCode: order.shortCode });
}
