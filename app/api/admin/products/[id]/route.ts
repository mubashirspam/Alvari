import { NextResponse } from "next/server";
import {
  adminDeleteProduct,
  adminFindProductById,
  adminUpdateProduct,
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
  const agg = await adminFindProductById(id);
  if (!agg) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ product: agg.product, variants: agg.variants, images: agg.images, blogSections: agg.blogSections });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  try {
    const row = await adminUpdateProduct(id, body as Parameters<typeof adminUpdateProduct>[1]);
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ product: row });
  } catch (error) {
    console.error("[admin/products/:id] update failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await adminDeleteProduct(id);
  return NextResponse.json({ ok: true });
}
