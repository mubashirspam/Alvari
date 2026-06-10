import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ReviewRateLimitError,
  submitReview,
} from "@/features/reviews/services/review-service";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const review = await submitReview(body, clientIp(request));
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Invalid input" },
        { status: 422 },
      );
    }
    if (error instanceof ReviewRateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    if (error instanceof Error && error.message === "Product not found") {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("[reviews] submit failed", error);
    return NextResponse.json(
      { message: "Could not save your review — please try again." },
      { status: 500 },
    );
  }
}
