import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { promoCodes } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  const orderTotal = Number(req.nextUrl.searchParams.get("total") ?? 0); // in rupees

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);

  if (!promo || !promo.isActive) {
    return NextResponse.json({ error: "Invalid or expired promo code." }, { status: 404 });
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return NextResponse.json({ error: "This promo code has expired." }, { status: 410 });
  }

  if (promo.maxUsages !== null && promo.usageCount >= promo.maxUsages) {
    return NextResponse.json({ error: "This promo code has been fully used." }, { status: 410 });
  }

  const minOrder = promo.minOrderInPaise / 100;
  if (orderTotal < minOrder) {
    return NextResponse.json(
      { error: `Minimum order ₹${minOrder.toLocaleString("en-IN")} required for this code.` },
      { status: 422 },
    );
  }

  // Calculate discount
  let discountRupees = 0;
  if (promo.discountType === "percent") {
    discountRupees = Math.round((orderTotal * promo.discountValue) / 100);
  } else {
    discountRupees = promo.discountValue / 100; // stored in paise
  }

  return NextResponse.json({
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountRupees,
    label:
      promo.discountType === "percent"
        ? `${promo.discountValue}% off`
        : `₹${(promo.discountValue / 100).toLocaleString("en-IN")} off`,
  });
}
