import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  payments,
  type NewPaymentRow,
  type PaymentRow,
  type PaymentStatus,
} from "@/lib/db/schema";

export async function insert(data: NewPaymentRow): Promise<PaymentRow> {
  const [row] = await db.insert(payments).values(data).returning();
  return row;
}

export async function findByRazorpayOrderId(
  razorpayOrderId: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.razorpayOrderId, razorpayOrderId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findByPaymentLinkId(
  paymentLinkId: string,
): Promise<PaymentRow | null> {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.razorpayPaymentLinkId, paymentLinkId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findByOrderId(orderId: string): Promise<PaymentRow[]> {
  return db.select().from(payments).where(eq(payments.orderId, orderId));
}

export async function markStatus(
  id: string,
  status: PaymentStatus,
  razorpayPaymentId?: string,
): Promise<PaymentRow | null> {
  const [row] = await db
    .update(payments)
    .set({
      status,
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id))
    .returning();
  return row ?? null;
}
