import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { insertOrderWithItems } from "@/features/orders/repositories/order-repository";
import { generateShortCode } from "@/features/orders/types";
import * as paymentRepo from "@/features/payments/repositories/payment-repository";
import { computeTotals, type PricedLine } from "@/lib/commerce/pricing";
import {
  createRazorpayOrder,
  razorpayConfigured,
} from "@/lib/payments/razorpay";
import { env } from "@/lib/env";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  productSlug: z.string(),
  productName: z.string(),
  variantSku: z.string().nullable().optional(),
  variantName: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(99),
  imageUrl: z.string().nullable().optional(),
});

const instantOrderSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(20),
  customerEmail: z.string().trim().email().max(160).optional().or(z.literal("")).nullable(),
  addressLine: z.string().trim().min(3).max(500),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().regex(/^\d{6}$/),
  notes: z.string().trim().max(2000).optional().nullable(),
  referralCode: z.string().trim().max(64).optional().nullable(),
  promoCode: z.string().trim().max(64).optional().nullable(),
  discountInPaise: z.number().int().min(0).optional(),
  items: z.array(itemSchema).min(1),
});

/**
 * Instant-payment checkout: creates the DB order (status pending_payment) and
 * a Razorpay Order, returns checkout params. Amount comes from DB prices —
 * never from the client.
 */
export async function POST(req: NextRequest) {
  if (!razorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment is not available right now." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = instantOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Load every product once: price, purchase mode, GST rate.
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      purchaseMode: products.purchaseMode,
      gstRate: products.gstRate,
      priceNowInPaise: products.priceNowInPaise,
    })
    .from(products)
    .where(inArray(products.id, productIds));
  const productById = new Map(productRows.map((p) => [p.id, p]));

  // Quote-mode items cannot be paid online at the listed price.
  const quoteItems = data.items.filter(
    (i) => productById.get(i.productId)?.purchaseMode === "quote",
  );
  if (quoteItems.length > 0) {
    return NextResponse.json(
      {
        error:
          "Some items in your cart are quote-based (price finalised by our team) and can't be paid online. Place the order via WhatsApp instead.",
        quoteItems: quoteItems.map((i) => i.productName),
      },
      { status: 422 },
    );
  }

  // Server-side pricing snapshot.
  const verifiedItems = [];
  const pricedLines: PricedLine[] = [];
  for (const item of data.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product not found: ${item.productId}` },
        { status: 422 },
      );
    }
    let unitPriceInPaise = product.priceNowInPaise;
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
    pricedLines.push({
      unitPriceInPaise,
      quantity: item.quantity,
      gstRate: product.gstRate,
    });
  }

  const totals = computeTotals(pricedLines, {
    discountInPaise: data.discountInPaise ?? 0,
  });
  const shortCode = generateShortCode();
  const shippingAddress = [data.addressLine, data.city, data.district, data.state, data.pincode]
    .filter(Boolean)
    .join(", ");

  const { order } = await insertOrderWithItems(
    {
      shortCode,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      shippingAddress,
      notes: data.notes ?? null,
      subtotalInPaise: totals.subtotalInPaise,
      taxInPaise: totals.taxInPaise,
      shippingInPaise: totals.shippingInPaise,
      totalInPaise: totals.totalInPaise,
      type: "instant",
      status: "pending_payment",
      placedVia: "website",
      placeOfSupplyState: data.state,
      referralCode: data.referralCode ?? null,
      promoCode: data.promoCode ?? null,
      discountInPaise: data.discountInPaise ?? 0,
    },
    verifiedItems,
  );

  try {
    const rzpOrder = await createRazorpayOrder({
      amountInPaise: totals.totalInPaise,
      receipt: shortCode,
      notes: { alvariOrderId: order.id },
    });
    await paymentRepo.insert({
      orderId: order.id,
      amountInPaise: totals.totalInPaise,
      razorpayOrderId: rzpOrder.id,
    });
    return NextResponse.json(
      {
        shortCode,
        razorpayOrderId: rzpOrder.id,
        keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID,
        amountInPaise: totals.totalInPaise,
        prefill: {
          name: data.customerName,
          contact: data.customerPhone,
          email: data.customerEmail || undefined,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[orders/instant] razorpay order creation failed", error);
    return NextResponse.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 },
    );
  }
}
