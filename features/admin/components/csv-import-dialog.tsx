"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { IMPORT_SPECS, type ImportEntity } from "@/features/admin/import/spec";
import type { ImportEvent } from "@/features/admin/import/types";

type Props = {
  entity: ImportEntity;
  /** Override the button label, e.g. "Import variants". */
  buttonLabel?: string;
};

type RowEvent = Extract<ImportEvent, { type: "row" }>;

type Phase = "idle" | "ready" | "importing" | "done" | "fatal";

/**
 * Bulk CSV import dialog. Uploads the file to /api/admin/import/[entity] and
 * renders the NDJSON progress stream live: progress bar, per-row statuses and
 * a created/updated/failed summary.
 */
export function CsvImportDialog({ entity, buttonLabel }: Props) {
  const spec = IMPORT_SPECS[entity];
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [showColumns, setShowColumns] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<RowEvent[]>([]);
  const [summary, setSummary] = useState<{ created: number; updated: number; failed: number } | null>(null);
  const [fatalMessage, setFatalMessage] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const processed = rows.length;
  const failedCount = rows.filter((r) => r.status === "error").length;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  // Keep the live log scrolled to the newest row.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [processed]);

  const reset = useCallback(() => {
    setPhase("idle");
    setFile(null);
    setTotal(0);
    setRows([]);
    setSummary(null);
    setFatalMessage(null);
  }, []);

  function close() {
    if (phase === "importing") return; // don't allow closing mid-import
    setOpen(false);
    if (phase === "done") router.refresh();
    reset();
  }

  function handleFile(f: File | null) {
    setFile(f);
    setPhase(f ? "ready" : "idle");
    setRows([]);
    setSummary(null);
    setFatalMessage(null);
  }

  async function runImport() {
    if (!file) return;
    setPhase("importing");
    setRows([]);
    setSummary(null);
    setFatalMessage(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/import/${entity}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setFatalMessage(err.message ?? `Import failed (HTTP ${res.status})`);
        setPhase("fatal");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleEvent = (event: ImportEvent) => {
        if (event.type === "start") setTotal(event.total);
        else if (event.type === "row") setRows((prev) => [...prev, event]);
        else if (event.type === "done") {
          setSummary({ created: event.created, updated: event.updated, failed: event.failed });
          setPhase("done");
        } else if (event.type === "fatal") {
          setFatalMessage(event.message);
          setPhase("fatal");
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) handleEvent(JSON.parse(line) as ImportEvent);
        }
      }
      if (buffer.trim()) handleEvent(JSON.parse(buffer) as ImportEvent);
    } catch (error) {
      setFatalMessage(error instanceof Error ? error.message : "Import failed");
      setPhase("fatal");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] px-5 py-3 text-sm tracking-wide text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        <Upload className="h-4 w-4" strokeWidth={1.6} />
        {buttonLabel ?? "Import CSV"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Import ${spec.label} from CSV`}
        >
          <div className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-line)] px-6 py-5">
              <div>
                <h2 className="font-serif text-[22px] tracking-[-0.02em] text-[var(--color-ink)]">
                  Import {spec.label.toLowerCase()}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  Upsert by <code className="rounded bg-[var(--color-bg-soft)] px-1">{spec.upsertKey}</code> — existing rows are updated, new ones created.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={phase === "importing"}
                aria-label="Close"
                className="rounded-full p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-ink)] disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Template + column reference */}
              {(phase === "idle" || phase === "ready") && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`/api/admin/import/${entity}/template`}
                      download
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-4 py-2 text-xs tracking-wide text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={1.6} />
                      Download CSV template
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowColumns((s) => !s)}
                      className="text-xs text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-ink)] hover:underline"
                    >
                      {showColumns ? "Hide column reference" : "Show column reference"}
                    </button>
                  </div>

                  {showColumns && (
                    <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--color-bg-soft)] text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                          <tr>
                            <th className="px-3 py-2 font-medium">Column</th>
                            <th className="px-3 py-2 font-medium">Required</th>
                            <th className="px-3 py-2 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {spec.columns.map((c) => (
                            <tr key={c.key} className="border-t border-[var(--color-line)] align-top">
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[var(--color-ink)]">{c.key}</td>
                              <td className="px-3 py-2">{c.required ? "Yes" : "—"}</td>
                              <td className="px-3 py-2 text-[var(--color-muted)]">{c.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* File picker */}
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] px-6 py-10 text-center transition hover:border-[var(--color-accent)]">
                    <FileSpreadsheet className="h-7 w-7 text-[var(--color-muted)]" strokeWidth={1.4} />
                    {file ? (
                      <>
                        <span className="text-sm font-medium text-[var(--color-ink)]">{file.name}</span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {(file.size / 1024).toFixed(1)} KB — click to choose a different file
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-[var(--color-ink)]">Choose a .csv file</span>
                        <span className="text-xs text-[var(--color-muted)]">
                          Save your Excel sheet as CSV (File → Save As → CSV UTF-8)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </>
              )}

              {/* Progress */}
              {(phase === "importing" || phase === "done") && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-muted)]">
                      <span>
                        {phase === "importing" ? "Importing…" : "Finished"} {processed}/{total} rows
                      </span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-soft)]">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${failedCount > 0 ? "bg-amber-600" : "bg-[var(--color-accent)]"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Live counters */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {(
                      [
                        ["Created", rows.filter((r) => r.status === "created").length, "text-emerald-700"],
                        ["Updated", rows.filter((r) => r.status === "updated").length, "text-[var(--color-ink)]"],
                        ["Failed", failedCount, failedCount > 0 ? "text-red-700" : "text-[var(--color-muted)]"],
                      ] as const
                    ).map(([label, count, color]) => (
                      <div key={label} className="rounded-xl border border-[var(--color-line)] px-3 py-2.5">
                        <p className={`text-lg font-medium ${color}`}>{count}</p>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Live row log */}
                  <div
                    ref={logRef}
                    className="max-h-[200px] overflow-y-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-3 font-mono text-[11px] leading-relaxed"
                  >
                    {rows.map((r) => (
                      <div key={r.index} className="flex items-start gap-2">
                        {r.status === "error" ? (
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-600" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        )}
                        <span className="text-[var(--color-ink)]">
                          #{r.index} {r.label} — {r.status}
                          {r.message ? <span className="text-red-700">: {r.message}</span> : null}
                        </span>
                      </div>
                    ))}
                    {phase === "importing" && (
                      <div className="flex items-center gap-2 text-[var(--color-muted)]">
                        <Loader2 className="h-3 w-3 animate-spin" /> processing…
                      </div>
                    )}
                  </div>

                  {summary && (
                    <p
                      className={`rounded-xl px-4 py-3 text-sm ${
                        summary.failed > 0
                          ? "bg-amber-50 text-amber-900"
                          : "bg-emerald-50 text-emerald-900"
                      }`}
                    >
                      Import complete — {summary.created} created, {summary.updated} updated
                      {summary.failed > 0
                        ? `, ${summary.failed} failed (fix the rows above and re-import just those rows; successful rows are already saved)`
                        : "."}
                    </p>
                  )}
                </div>
              )}

              {phase === "fatal" && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{fatalMessage}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4">
              {phase === "fatal" && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-5 py-2.5 text-xs tracking-wide text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </button>
              )}
              {(phase === "idle" || phase === "ready") && (
                <button
                  type="button"
                  onClick={runImport}
                  disabled={!file}
                  className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start import
                </button>
              )}
              {phase === "importing" && (
                <span className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing — keep this window open
                </span>
              )}
              {phase === "done" && (
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm tracking-wide text-[var(--color-bg)] transition hover:bg-[var(--color-accent)]"
                >
                  Done — refresh list
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
