"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

export type CustomOrderData = {
  isCustom: boolean;
  dimensions: string;
  woodType: string;
  finish: string;
  timeline: string;
  referenceImages: string[]; // ImageKit URLs
};

const EMPTY: CustomOrderData = {
  isCustom: false,
  dimensions: "",
  woodType: "",
  finish: "",
  timeline: "",
  referenceImages: [],
};

const WOOD_TYPES = ["Teak", "Rosewood", "Rubber wood", "Plywood + Veneer", "MDF + Veneer", "Other"];
const FINISHES = ["Natural / Matte", "Glossy", "Semi-gloss", "Painted", "Walnut stain", "Dark Ebony", "Other"];
const TIMELINES = ["No rush (4–6 weeks)", "Standard (2–4 weeks)", "Urgent (1–2 weeks)"];

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]";

export function CustomOrderSection({
  value,
  onChange,
}: {
  value: CustomOrderData;
  onChange: (v: CustomOrderData) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof CustomOrderData>(k: K, v: CustomOrderData[K]) =>
    onChange({ ...value, [k]: v });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 3 - value.referenceImages.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      // Get ImageKit upload auth token
      const authRes = await fetch("/api/upload-auth");
      const auth = await authRes.json();

      const uploaded: string[] = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", `custom-ref-${Date.now()}-${file.name}`);
        formData.append("folder", "/kaasth/custom-orders");
        formData.append("publicKey", auth.publicKey ?? "");
        formData.append("signature", auth.signature);
        formData.append("expire", String(auth.expire));
        formData.append("token", auth.token);

        const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploaded.push(data.url ?? data.filePath);
        }
      }

      if (uploaded.length > 0) {
        set("referenceImages", [...value.referenceImages, ...uploaded]);
      }
    } catch {
      // Upload failed silently — user can retry
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    set(
      "referenceImages",
      value.referenceImages.filter((u) => u !== url),
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6">
      {/* Toggle */}
      <label className="flex cursor-pointer items-start gap-3">
        <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={value.isCustom}
            onChange={(e) => onChange({ ...EMPTY, isCustom: e.target.checked })}
            className="peer h-5 w-5 cursor-pointer rounded border-2 border-[var(--color-line)] accent-[var(--color-accent)] outline-none"
          />
        </div>
        <div>
          <p className="font-serif text-lg leading-tight text-[var(--color-ink)]">
            This is a custom order
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
            Share dimensions, references and preferences — we'll build it exactly to your spec.
          </p>
        </div>
      </label>

      {value.isCustom && (
        <div className="mt-5 space-y-4 border-t border-[var(--color-line)] pt-5">
          {/* Dimensions */}
          <SmallField label="Dimensions / Size">
            <input
              type="text"
              value={value.dimensions}
              onChange={(e) => set("dimensions", e.target.value)}
              placeholder="e.g. 6ft × 3ft × 7ft, or L180 × W90 × H200 cm"
              className={inputCls}
            />
          </SmallField>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Wood type */}
            <SmallField label="Wood / Material preference">
              <select
                value={value.woodType}
                onChange={(e) => set("woodType", e.target.value)}
                className={inputCls}
              >
                <option value="">Select or leave open</option>
                {WOOD_TYPES.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </SmallField>

            {/* Finish */}
            <SmallField label="Finish / Colour">
              <select
                value={value.finish}
                onChange={(e) => set("finish", e.target.value)}
                className={inputCls}
              >
                <option value="">Select or leave open</option>
                {FINISHES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </SmallField>
          </div>

          {/* Timeline */}
          <SmallField label="Timeline">
            <div className="flex flex-wrap gap-2">
              {TIMELINES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("timeline", t)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    value.timeline === t
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
                      : "border-[var(--color-line)] text-[var(--color-muted)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </SmallField>

          {/* Reference images */}
          <SmallField label={`Reference images (${value.referenceImages.length}/3)`}>
            <div className="flex flex-wrap gap-3">
              {value.referenceImages.map((url) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--color-line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Reference" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {value.referenceImages.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--color-line)] text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span className="text-[10px]">Upload</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--color-muted)]">
              Upload inspiration photos, sketches, or existing furniture. JPG/PNG, max 5MB each.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={handleFileChange}
            />
          </SmallField>
        </div>
      )}
    </section>
  );
}
