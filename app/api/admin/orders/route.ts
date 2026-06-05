import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  findAllForAdmin,
  findItemsForOrderIds,
} from "@/features/orders/repositories/order-repository";
import { mapOrder } from "@/features/orders/types";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 500);

  const orderRows = await findAllForAdmin(limit, status as never);
  const itemsByOrder = await findItemsForOrderIds(orderRows.map((o) => o.id));

  const orders = orderRows.map((row) =>
    mapOrder(row, itemsByOrder.get(row.id) ?? []),
  );

  return NextResponse.json(orders);
}
