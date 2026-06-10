import { NextResponse } from "next/server";
import { toCsv } from "@/lib/admin/csv";
import { isImportEntity, templateRows } from "@/features/admin/import/spec";
import { requireAdmin } from "@/lib/auth/session";

type Params = Promise<{ entity: string }>;

/** Downloadable CSV template: header row + one realistic example row. */
export async function GET(_req: Request, { params }: { params: Params }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { entity } = await params;
  if (!isImportEntity(entity)) {
    return NextResponse.json(
      { message: `Unknown import entity "${entity}"` },
      { status: 404 },
    );
  }

  return new Response(toCsv(templateRows(entity)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entity}-import-template.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
