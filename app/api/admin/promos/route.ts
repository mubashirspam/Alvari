import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { promoCodes } from "@/lib/db/schema";

const createSchema = z.object({
  code: z.string().trim().min(2).max(32).transform((s) => s.toUpperCase()),
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.number().int().positive(),
  minOrderRupees: z.number().int().min(0).optional(),
  maxUsages: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  const d = parsed.data;
  const [row] = await db.insert(promoCodes).values({
    code: d.code,
    discountType: d.discountType,
    discountValue: d.discountType === "flat" ? d.discountValue * 100 : d.discountValue, // flat stored in paise
    minOrderInPaise: (d.minOrderRupees ?? 0) * 100,
    maxUsages: d.maxUsages ?? null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
