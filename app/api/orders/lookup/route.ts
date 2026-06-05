import { NextRequest, NextResponse } from "next/server";
import { findByPhone } from "@/features/orders/repositories/order-repository";
import { mapOrder } from "@/features/orders/types";
import { db } from "@/lib/db";
import { orderItems } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

// Simple in-memory rate limiter: max 5 lookups per IP per minute
const rateMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  const phone = req.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit phone number." },
      { status: 400 },
    );
  }

  // Try both with and without country code
  const variants = [phone, phone.replace(/^91/, ""), "91" + phone.replace(/^91/, "")];
  let orderRows = await findByPhone(variants[0]);
  if (orderRows.length === 0 && variants[1] !== variants[0])
    orderRows = await findByPhone(variants[1]);
  if (orderRows.length === 0 && variants[2] !== variants[0])
    orderRows = await findByPhone(variants[2]);

  if (orderRows.length === 0) {
    return NextResponse.json({ orders: [] });
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

  const orders = orderRows.slice(0, 20).map((row) =>
    mapOrder(row, byOrder.get(row.id) ?? []),
  );

  // Redact sensitive fields before sending to unauthenticated caller
  const safe = orders.map(({ id: _id, userId: _uid, customerEmail: _ce, ...o }) => o);

  return NextResponse.json({ orders: safe });
}
