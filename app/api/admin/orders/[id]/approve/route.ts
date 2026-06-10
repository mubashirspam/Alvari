import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  findById,
  updateStatus,
} from "@/features/orders/repositories/order-repository";
import * as paymentRepo from "@/features/payments/repositories/payment-repository";
import { assertTransition, IllegalTransitionError } from "@/lib/commerce/status";
import {
  createPaymentLink,
  razorpayConfigured,
} from "@/lib/payments/razorpay";

/**
 * Approves a quoted order (quoted → approved) and creates a Razorpay payment
 * link for the quoted amount. Returns the link URL for the admin to share
 * over WhatsApp. When the customer pays, the webhook moves the order to
 * confirmed.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const order = await findById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    assertTransition(order.status, "approved");
  } catch (error) {
    if (error instanceof IllegalTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  if (!order.quotedTotalInPaise || order.quotedTotalInPaise <= 0) {
    return NextResponse.json(
      { error: "Set a quote amount before approving." },
      { status: 422 },
    );
  }
  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Razorpay is not configured — cannot create a payment link." },
      { status: 503 },
    );
  }

  try {
    const link = await createPaymentLink({
      amountInPaise: order.quotedTotalInPaise,
      referenceId: order.shortCode,
      description: `Alvari order ${order.shortCode}`,
      customer: {
        name: order.customerName,
        contact: order.customerPhone,
        email: order.customerEmail,
      },
    });
    await paymentRepo.insert({
      orderId: order.id,
      amountInPaise: order.quotedTotalInPaise,
      razorpayPaymentLinkId: link.id,
    });
    await updateStatus(order.id, "approved");
    return NextResponse.json({ ok: true, paymentLinkUrl: link.short_url });
  } catch (error) {
    console.error("[admin/orders/approve] payment link failed", error);
    return NextResponse.json(
      { error: "Could not create the payment link. Try again." },
      { status: 502 },
    );
  }
}
