import { NextResponse } from "next/server";
import {
  createAttributeDef,
  findAllAttributeDefs,
} from "@/features/variant-attributes/repositories/variant-attribute-repository";
import { variantAttributeCreateSchema } from "@/features/variant-attributes/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const defs = await findAllAttributeDefs();
  return NextResponse.json({ defs });
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
  const parsed = variantAttributeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  try {
    const def = await createAttributeDef(parsed.data);
    return NextResponse.json({ def }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && /cva_category_key_idx|duplicate/.test(error.message)
        ? "That category already has an attribute with this key."
        : "Failed to create";
    console.error("[admin/variant-attributes] create failed", error);
    return NextResponse.json({ message }, { status: 500 });
  }
}
