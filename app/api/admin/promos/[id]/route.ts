import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { promoCodes } from "@/lib/db/schema";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  await db.update(promoCodes).set({ isActive: false }).where(eq(promoCodes.id, id));
  return NextResponse.json({ ok: true });
}
