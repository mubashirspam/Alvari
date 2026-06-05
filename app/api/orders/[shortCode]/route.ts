import { NextRequest, NextResponse } from "next/server";
import {
  findByShortCode,
  findItemsByOrderId,
} from "@/features/orders/repositories/order-repository";
import { mapOrder } from "@/features/orders/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await params;
  const orderRow = await findByShortCode(shortCode.toUpperCase());
  if (!orderRow) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const itemRows = await findItemsByOrderId(orderRow.id);
  const order = mapOrder(orderRow, itemRows);

  // Strip internal fields before returning to the public
  const { id: _id, userId: _userId, ...safe } = order;
  return NextResponse.json(safe);
}
