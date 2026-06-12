import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { products, productVariants, promoCodes } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { insertOrderWithItems } from "@/features/orders/repositories/order-repository";
import { mapOrder, generateShortCode } from "@/features/orders/types";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-email";
import { env } from "@/lib/env";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  productSlug: z.string(),
  productName: z.string(),
  variantSku: z.string().nullable().optional(),
  variantName: z.string().nullable().optional(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().min(1).max(99),
  imageUrl: z.string().nullable().optional(),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(20),
  customerEmail: z.string().trim().email().max(160).optional().or(z.literal("")).nullable(),
  addressLine: z.string().trim().min(3).max(500),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  notes: z.string().trim().max(2000).optional().nullable(),
  referralCode: z.string().trim().max(64).optional().nullable(),
  promoCode: z.string().trim().max(64).optional().nullable(),
  discountInPaise: z.number().int().min(0).optional(),
  isCustomOrder: z.boolean().optional(),
  customDimensions: z.string().trim().max(500).optional().nullable(),
  customWoodType: z.string().trim().max(100).optional().nullable(),
  customFinish: z.string().trim().max(100).optional().nullable(),
  customTimeline: z.string().trim().max(100).optional().nullable(),
  customReferenceImages: z.array(z.string().url()).max(3).optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const shippingAddress = [
    data.addressLine,
    data.city,
    data.district,
    data.state,
    data.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  // Verify prices server-side against DB to prevent tampering
  const verifiedItems: Array<{
    productId: string;
    productSlug: string;
    productName: string;
    variantId: string | null;
    variantSku: string | null;
    variantName: string | null;
    unitPriceInPaise: number;
    quantity: number;
    lineTotalInPaise: number;
    imageUrl: string | null;
  }> = [];

  // Mirror of partitionCheckout: the WhatsApp/quote path takes quote items
  // only. Instant ("Available") products are pay-online only — reject them
  // here so a crafted request can't route them around online payment.
  const modeRows = await db
    .select({
      id: products.id,
      name: products.name,
      purchaseMode: products.purchaseMode,
    })
    .from(products)
    .where(inArray(products.id, [...new Set(data.items.map((i) => i.productId))]));
  const modeById = new Map(modeRows.map((p) => [p.id, p]));
  const instantItems = data.items.filter(
    (i) => modeById.get(i.productId)?.purchaseMode === "instant",
  );
  if (instantItems.length > 0) {
    return NextResponse.json(
      {
        error:
          "These items are pay-online only — use the online payment option at checkout.",
        blockedItems: [...new Set(instantItems.map((i) => i.productName))],
      },
      { status: 422 },
    );
  }
  const hasQuoteItems = modeRows.some((p) => p.purchaseMode === "quote");

  for (const item of data.items) {
    let unitPriceInPaise: number;

    if (item.variantId) {
      const [variant] = await db
        .select({ priceNowInPaise: productVariants.priceNowInPaise })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found: ${item.variantId}` },
          { status: 422 },
        );
      }
      unitPriceInPaise = variant.priceNowInPaise;
    } else {
      const [product] = await db
        .select({ priceNowInPaise: products.priceNowInPaise })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 422 },
        );
      }
      unitPriceInPaise = product.priceNowInPaise;
    }

    verifiedItems.push({
      productId: item.productId,
      productSlug: item.productSlug,
      productName: item.productName,
      variantId: item.variantId ?? null,
      variantSku: item.variantSku ?? null,
      variantName: item.variantName ?? null,
      unitPriceInPaise,
      quantity: item.quantity,
      lineTotalInPaise: unitPriceInPaise * item.quantity,
      imageUrl: item.imageUrl ?? null,
    });
  }

  const subtotalInPaise = verifiedItems.reduce((s, it) => s + it.lineTotalInPaise, 0);
  const shortCode = generateShortCode();

  const { order: orderRow, items: itemRows } = await insertOrderWithItems(
    {
      shortCode,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      shippingAddress,
      notes: data.notes ?? null,
      subtotalInPaise,
      totalInPaise: Math.max(0, subtotalInPaise - (data.discountInPaise ?? 0)),
      type: hasQuoteItems ? "quote" : "standard",
      status: hasQuoteItems ? "enquiry" : "pending",
      placedVia: "website",
      referralCode: data.referralCode ?? null,
      promoCode: data.promoCode ?? null,
      discountInPaise: data.discountInPaise ?? 0,
      isCustomOrder: data.isCustomOrder ?? false,
      customDimensions: data.customDimensions ?? null,
      customWoodType: data.customWoodType ?? null,
      customFinish: data.customFinish ?? null,
      customTimeline: data.customTimeline ?? null,
      customReferenceImages: data.customReferenceImages ?? [],
    },
    verifiedItems,
  );

  const order = mapOrder(orderRow, itemRows);
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Increment promo usage count (best-effort)
  if (data.promoCode) {
    void db
      .update(promoCodes)
      .set({ usageCount: sql`${promoCodes.usageCount} + 1` })
      .where(eq(promoCodes.code, data.promoCode));
  }

  // Send confirmation email to customer only (if email provided)
  void sendOrderConfirmationEmail(order, siteUrl);

  return NextResponse.json({ shortCode: order.shortCode }, { status: 201 });
}
