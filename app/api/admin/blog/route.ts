import { NextResponse } from "next/server";
import {
  adminCreatePost,
  adminFindAllPosts,
} from "@/features/admin/repositories/blog-admin-repository";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const posts = await adminFindAllPosts();
  return NextResponse.json({ posts });
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
    const row = await adminCreatePost(
      body as Parameters<typeof adminCreatePost>[0],
    );
    return NextResponse.json({ post: row }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 },
    );
  }
}
