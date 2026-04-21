import { NextResponse } from "next/server";
import {
  adminGetProductBlogLinks,
  adminSetProductBlogLinks,
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
  const links = await adminGetProductBlogLinks(id);
  return NextResponse.json({ links });
}

export async function PUT(request: Request, { params }: { params: Params }) {
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
  const { blogPostIds } = body as { blogPostIds: string[] };
  if (!Array.isArray(blogPostIds)) {
    return NextResponse.json({ message: "blogPostIds must be an array" }, { status: 400 });
  }
  await adminSetProductBlogLinks(productId, blogPostIds);
  return NextResponse.json({ ok: true });
}
