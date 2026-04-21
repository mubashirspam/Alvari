import { NextResponse } from "next/server";
import {
  adminDeletePost,
  adminFindPostById,
  adminUpdatePost,
} from "@/features/admin/repositories/blog-admin-repository";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const post = await adminFindPostById(id);
  if (!post) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
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
    const row = await adminUpdatePost(
      id,
      body as Parameters<typeof adminUpdatePost>[1],
    );
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ post: row });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update post" },
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
  await adminDeletePost(id);
  return NextResponse.json({ ok: true });
}
