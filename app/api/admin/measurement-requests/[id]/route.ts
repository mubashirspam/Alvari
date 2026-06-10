import { NextResponse } from "next/server";
import { z } from "zod";
import { adminSetMeasurementStatus } from "@/features/measurements/services/measurement-service";
import { measurementStatusEnum } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";

const patchSchema = z.object({
  status: z.enum(measurementStatusEnum.enumValues),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status" }, { status: 422 });
  }

  const row = await adminSetMeasurementStatus(id, parsed.data.status);
  if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ request: row });
}
