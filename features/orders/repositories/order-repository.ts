import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  type NewOrderItemRow,
  type NewOrderRow,
  type OrderItemRow,
  type OrderRow,
  type OrderStatus,
} from "@/lib/db/schema";

export async function insertOrderWithItems(
  order: NewOrderRow,
  items: Omit<NewOrderItemRow, "orderId">[],
): Promise<{ order: OrderRow; items: OrderItemRow[] }> {
  // Neon HTTP driver doesn't expose real cross-statement transactions, so we
  // insert the order first and then the items. If item insertion fails the
  // order is orphaned (no line items) — the success page checks for that and
  // the admin can delete the empty order.
  const [insertedOrder] = await db.insert(orders).values(order).returning();
  if (!insertedOrder) throw new Error("Failed to insert order");

  if (items.length === 0) return { order: insertedOrder, items: [] };

  const insertedItems = await db
    .insert(orderItems)
    .values(items.map((it) => ({ ...it, orderId: insertedOrder.id })))
    .returning();
  return { order: insertedOrder, items: insertedItems };
}

export async function findById(id: string): Promise<OrderRow | null> {
  const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findByShortCode(
  shortCode: string,
): Promise<OrderRow | null> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.shortCode, shortCode))
    .limit(1);
  return rows[0] ?? null;
}

export async function findItemsByOrderId(
  orderId: string,
): Promise<OrderItemRow[]> {
  return db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
}

export async function findItemsForOrderIds(
  orderIds: string[],
): Promise<Map<string, OrderItemRow[]>> {
  if (orderIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));
  const byOrder = new Map<string, OrderItemRow[]>();
  for (const row of rows) {
    const list = byOrder.get(row.orderId) ?? [];
    list.push(row);
    byOrder.set(row.orderId, list);
  }
  return byOrder;
}

export async function findAllForAdmin(
  limit = 200,
  status?: OrderStatus,
): Promise<OrderRow[]> {
  const q = db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  if (status) return q.where(eq(orders.status, status));
  return q;
}

export async function findByPhone(phone: string): Promise<OrderRow[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.customerPhone, phone))
    .orderBy(desc(orders.createdAt));
}

export async function updateStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderRow | null> {
  const updated = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();
  return updated[0] ?? null;
}

/** Quote flow: stores the admin's final amount and mirrors it onto the total. */
export async function setQuote(
  id: string,
  quotedTotalInPaise: number,
  adminNote: string | null,
): Promise<OrderRow | null> {
  const updated = await db
    .update(orders)
    .set({
      quotedTotalInPaise,
      totalInPaise: quotedTotalInPaise,
      status: "quoted",
      ...(adminNote !== null ? { adminNote } : {}),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id))
    .returning();
  return updated[0] ?? null;
}

export async function markWhatsappOpened(id: string): Promise<void> {
  await db
    .update(orders)
    .set({ whatsappOpenedAt: new Date(), updatedAt: new Date() })
    .where(eq(orders.id, id));
}
