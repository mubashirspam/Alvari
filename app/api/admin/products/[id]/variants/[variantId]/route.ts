import { NextResponse } from "next/server";
import {
  adminDeleteVariant,
  adminUpdateVariant,
} from "@/features/admin/repositories/product-admin-repository";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ id: string; variantId: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { variantId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  try {
    const row = await adminUpdateVariant(
      variantId,
      body as Parameters<typeof adminUpdateVariant>[1],
    );
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ variant: row });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update" },
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
  const { variantId } = await params;
  await adminDeleteVariant(variantId);
  return NextResponse.json({ ok: true });
}
