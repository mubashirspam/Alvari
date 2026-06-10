import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  MeasurementRateLimitError,
  submitMeasurementRequest,
} from "@/features/measurements/services/measurement-service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    const row = await submitMeasurementRequest(body, ip);
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Invalid input" },
        { status: 422 },
      );
    }
    if (error instanceof MeasurementRateLimitError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }
    console.error("[measurement-requests] create failed", error);
    return NextResponse.json(
      { message: "Could not submit your request — please try again." },
      { status: 500 },
    );
  }
}
