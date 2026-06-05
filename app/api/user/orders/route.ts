import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { findByPhone } from "@/features/orders/repositories/order-repository";
import { mapOrder } from "@/features/orders/types";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find orders where customerEmail matches the signed-in user's email
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerEmail, user.email))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  if (orderRows.length === 0) {
    return NextResponse.json({ orders: [], email: user.email, name: user.name });
  }

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderRows.map((o) => o.id)));

  const byOrder = new Map<string, typeof itemRows>();
  for (const it of itemRows) {
    const list = byOrder.get(it.orderId) ?? [];
    list.push(it);
    byOrder.set(it.orderId, list);
  }

  const mapped = orderRows.map((row) =>
    mapOrder(row, byOrder.get(row.id) ?? []),
  );

  return NextResponse.json({ orders: mapped, email: user.email, name: user.name });
}
