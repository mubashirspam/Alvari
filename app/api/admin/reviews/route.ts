import { NextResponse } from "next/server";
import { adminListReviews } from "@/features/reviews/services/review-service";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const status = new URL(request.url).searchParams.get("status");
  const reviews = await adminListReviews(
    status === "approved" || status === "hidden" ? status : undefined,
  );
  return NextResponse.json({ reviews });
}
