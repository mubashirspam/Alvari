import { NextResponse } from "next/server";
import {
  adminDeleteImage,
  adminUpdateImage,
} from "@/features/admin/repositories/product-admin-repository";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ id: string; imageId: string }>;

export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { imageId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const row = await adminUpdateImage(
    imageId,
    body as Parameters<typeof adminUpdateImage>[1],
  );
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ image: row });
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { imageId } = await params;
  await adminDeleteImage(imageId);
  return NextResponse.json({ ok: true });
}
