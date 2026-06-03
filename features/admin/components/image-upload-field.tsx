"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { buildImageKitUrl } from "@/lib/imagekit";
import { uploadImageToImageKit, type UploadFolder } from "@/lib/admin/upload-image";

type Props = {
  /** Form field name — a hidden input carries the stored image path. */
  name: string;
  /** ImageKit destination folder. */
  folder: UploadFolder;
  /** Existing image path/URL when editing. */
  defaultValue?: string | null;
  label?: string;
  hint?: string;
  required?: boolean;
  /** Tailwind aspect class for the preview box. */
  aspectClass?: string;
};

/**
 * Drop-in image picker for admin forms. Compresses to <300 KB, uploads to
 * ImageKit, and stores the resulting path in a hidden input so the surrounding
 * <form> submits it like any other field. No pasted URLs.
 */
export function ImageUploadField({
  name,
  folder,
  defaultValue,
  label,
  hint,
  required = false,
  aspectClass = "aspect-[16/9]",
}: Props) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  async function handleFile(file: File) {
    setError(null);
    setInfo(null);
    setUploading(true);
    setProgress(0);
    try {
      const { filePath, sizeKb } = await uploadImageToImageKit(file, folder, setProgress);
      setValue(filePath);
      setInfo(`Uploaded · ${sizeKb} KB`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const previewSrc = value
    ? buildImageKitUrl(value, { width: 800, quality: 70, format: "auto" })
    : null;

  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <input type="hidden" name={name} value={value} />

      <div className="mt-1.5 space-y-2">
        <div
          className={`relative overflow-hidden rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] ${aspectClass}`}
        >
          {previewSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setInfo(null);
                }}
                aria-label="Remove image"
                className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ink)]/80 text-[var(--color-bg)] backdrop-blur transition hover:bg-[var(--color-ink)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center text-[var(--color-muted)]">
              <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
              <span className="text-xs">No image</span>
            </div>
          )}

          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-ink)]/70 text-[var(--color-bg)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs">{progress > 0 ? `Uploading… ${progress}%` : "Optimising…"}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="block w-full text-sm text-[var(--color-muted)] file:mr-3 file:rounded-full file:border file:border-[var(--color-line)] file:bg-[var(--color-bg)] file:px-4 file:py-2 file:text-xs file:text-[var(--color-ink)] hover:file:border-[var(--color-accent)] disabled:opacity-50"
          />
        </div>

        {required && !value ? (
          <p className="text-xs text-[var(--color-muted)]">An image is required.</p>
        ) : null}
        {hint ? <p className="text-xs text-[var(--color-muted)]">{hint}</p> : null}
        {info ? <p className="text-xs text-[var(--color-accent)]">{info}</p> : null}
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}
