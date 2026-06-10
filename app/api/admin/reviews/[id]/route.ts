import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  adminActOnReview,
  adminDeleteReview,
} from "@/features/reviews/services/review-service";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

/** PATCH body: { action: "reply", reply } | { action: "hide" } | { action: "show" } */
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
    const row = await adminActOnReview(id, body);
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ review: row });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Invalid input" },
        { status: 422 },
      );
    }
    console.error("[admin/reviews] action failed", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await adminDeleteReview(id);
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
