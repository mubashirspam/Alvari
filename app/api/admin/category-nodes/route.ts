import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  createNode,
  getFlatNodes,
} from "@/features/category-tree/services/category-tree-service";
import { categoryNodeCreateSchema } from "@/features/category-tree/schema";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const nodes = await getFlatNodes();
  return NextResponse.json({ nodes });
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
  const parsed = categoryNodeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  try {
    const node = await createNode(parsed.data);
    revalidatePath("/");
    revalidatePath("/admin/category-tree");
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error("[admin/category-nodes] create failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 },
    );
  }
}
