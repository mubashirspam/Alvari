import type { ImportEntity } from "./spec";

/** NDJSON events streamed from POST /api/admin/import/[entity]. */
export type ImportEvent =
  | { type: "start"; entity: ImportEntity; total: number }
  | {
      type: "row";
      /** 1-based data-row number (excluding the header). */
      index: number;
      status: "created" | "updated" | "error";
      /** Human label for the row, e.g. the slug/SKU. */
      label: string;
      message?: string;
    }
  | { type: "done"; created: number; updated: number; failed: number }
  | { type: "fatal"; message: string };
