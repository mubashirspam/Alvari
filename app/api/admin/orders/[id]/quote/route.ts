import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  findById,
  setQuote,
} from "@/features/orders/repositories/order-repository";
import { assertTransition, IllegalTransitionError } from "@/lib/commerce/status";

const quoteSchema = z.object({
  /** Final quoted amount in rupees (admin types rupees; stored as paise). */
  quotedTotalRupees: z.number().positive().max(10_000_000),
  adminNote: z.string().trim().max(2000).optional().nullable(),
});

/** Sets the admin's final quote on an enquiry: enquiry → quoted. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 422 },
    );
  }

  const order = await findById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    assertTransition(order.status, "quoted");
  } catch (error) {
    if (error instanceof IllegalTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  const updated = await setQuote(
    id,
    Math.round(parsed.data.quotedTotalRupees * 100),
    parsed.data.adminNote ?? null,
  );
  return NextResponse.json({ ok: true, order: updated });
}
