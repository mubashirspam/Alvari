import { NextResponse } from "next/server";
import { parseCsv } from "@/lib/admin/csv";
import {
  createImportContext,
  ImportRowError,
  importRow,
} from "@/features/admin/import/importers";
import { IMPORT_SPECS, isImportEntity } from "@/features/admin/import/spec";
import type { ImportEvent } from "@/features/admin/import/types";
import { requireAdmin } from "@/lib/auth/session";
import { submitToIndexNow } from "@/lib/seo/indexnow";

export const maxDuration = 300;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB ≈ tens of thousands of rows
const MAX_ROWS = 5000;

type Params = Promise<{ entity: string }>;

/**
 * Bulk CSV import. Accepts multipart form data with a `file` field and
 * streams NDJSON progress events (one JSON object per line) so the admin UI
 * can render live per-row status.
 */
export async function POST(request: Request, { params }: { params: Params }) {
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

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ message: "Expected multipart form data" }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ message: "Missing \"file\" field" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ message: "File too large (max 5 MB)" }, { status: 413 });
  }

  const text = await file.text();
  const { headers, records } = parseCsv(text);

  const spec = IMPORT_SPECS[entity];
  const known = new Set(spec.columns.map((c) => c.key));
  const requiredMissing = spec.columns
    .filter((c) => c.required && !headers.includes(c.key))
    .map((c) => c.key);
  if (requiredMissing.length > 0) {
    return NextResponse.json(
      {
        message: `CSV is missing required column(s): ${requiredMissing.join(", ")}. Download the template for the expected format.`,
        unknownColumns: headers.filter((h) => h && !known.has(h)),
      },
      { status: 422 },
    );
  }
  if (records.length === 0) {
    return NextResponse.json({ message: "CSV has no data rows" }, { status: 422 });
  }
  if (records.length > MAX_ROWS) {
    return NextResponse.json(
      { message: `Too many rows (${records.length}); max ${MAX_ROWS} per import` },
      { status: 422 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ImportEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      send({ type: "start", entity, total: records.length });

      const ctx = createImportContext();
      let created = 0;
      let updated = 0;
      let failed = 0;
      const touchedProductSlugs: string[] = [];

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const fallbackLabel =
          record[spec.upsertKey]?.trim() || `row ${i + 1}`;
        try {
          const result = await importRow(entity, record, ctx);
          if (result.status === "created") created++;
          else updated++;
          if (entity === "products") touchedProductSlugs.push(result.label);
          send({ type: "row", index: i + 1, status: result.status, label: result.label });
        } catch (error) {
          failed++;
          const message =
            error instanceof ImportRowError
              ? error.message
              : error instanceof Error
                ? `unexpected error: ${error.message}`
                : "unexpected error";
          if (!(error instanceof ImportRowError)) {
            console.error(`[import/${entity}] row ${i + 1} failed`, error);
          }
          send({ type: "row", index: i + 1, status: "error", label: fallbackLabel, message });
        }
      }

      if (touchedProductSlugs.length > 0) {
        submitToIndexNow([
          ...touchedProductSlugs.map((slug) => `/products/${slug}`),
          "/products",
        ]);
      }

      send({ type: "done", created, updated, failed });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
