import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  deleteNode,
  updateNode,
} from "@/features/category-tree/services/category-tree-service";
import { categoryNodeUpdateSchema } from "@/features/category-tree/schema";
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
  const parsed = categoryNodeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  try {
    const node = await updateNode(id, parsed.data);
    if (!node) return NextResponse.json({ message: "Not found" }, { status: 404 });
    revalidatePath("/");
    revalidatePath("/admin/category-tree");
    return NextResponse.json({ node });
  } catch (error) {
    console.error("[admin/category-nodes/:id] update failed", error);
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
  const { id } = await params;
  try {
    await deleteNode(id);
    revalidatePath("/");
    revalidatePath("/admin/category-tree");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/category-nodes/:id] delete failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 },
    );
  }
}
