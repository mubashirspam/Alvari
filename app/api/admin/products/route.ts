import { NextResponse } from "next/server";
import {
  adminCreateProduct,
  adminFindAllProducts,
} from "@/features/admin/repositories/product-admin-repository";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const rows = await adminFindAllProducts();
  return NextResponse.json({ products: rows });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  try {
    const row = await adminCreateProduct(body as Parameters<typeof adminCreateProduct>[0]);
    return NextResponse.json({ product: row }, { status: 201 });
  } catch (error) {
    console.error("[admin/products] create failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 },
    );
  }
}
