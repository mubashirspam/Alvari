import { NextResponse } from "next/server";
import {
  deleteAttributeDef,
  updateAttributeDef,
} from "@/features/variant-attributes/repositories/variant-attribute-repository";
import { variantAttributeUpdateSchema } from "@/features/variant-attributes/schema";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

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
  const parsed = variantAttributeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const def = await updateAttributeDef(id, parsed.data);
  if (!def) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ def });
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteAttributeDef(id);
  if (!ok) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
