import { NextResponse } from "next/server";
import {
  adminCreateVariant,
  adminFindVariantsByProduct,
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
  const variants = await adminFindVariantsByProduct(id);
  return NextResponse.json({ variants });
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  try {
    const row = await adminCreateVariant({
      ...(body as Record<string, unknown>),
      productId,
    } as Parameters<typeof adminCreateVariant>[0]);
    return NextResponse.json({ variant: row }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create variant" },
      { status: 500 },
    );
  }
}
