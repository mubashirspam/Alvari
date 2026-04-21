import { NextResponse } from "next/server";
import {
  adminCreateImage,
  adminFindImagesByProduct,
} from "@/features/admin/repositories/product-admin-repository";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const images = await adminFindImagesByProduct(id);
  return NextResponse.json({ images });
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;

  let body: { imageKey?: string; alt?: string; variantId?: string; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { imageKey, alt, variantId, sortOrder } = body;
  if (!imageKey) {
    return NextResponse.json({ message: "imageKey is required" }, { status: 400 });
  }

  const row = await adminCreateImage({
    productId,
    variantId: variantId || null,
    imageKey,
    alt: alt || null,
    sortOrder: sortOrder ?? 0,
  });

  return NextResponse.json({ image: row }, { status: 201 });
}
