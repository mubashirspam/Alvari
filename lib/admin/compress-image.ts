/**
 * Client-side image compression. Re-encodes a picked image to WebP, scaling it
 * down and lowering quality until it fits under `maxBytes` (default 300 KB).
 * Runs in the browser only (uses canvas) — import from "use client" modules.
 */
export async function compressImage(
  file: File,
  opts: { maxBytes?: number; maxDim?: number } = {},
): Promise<File> {
  const maxBytes = opts.maxBytes ?? 300 * 1024;
  const maxDim = opts.maxDim ?? 1920;

  // Vector / non-raster formats can't be re-encoded via canvas — pass through.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Unsupported source (e.g. HEIC on some browsers) — let the server handle it.
    return file;
  }

  let width = bitmap.width;
  let height = bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }

  const draw = (w: number, h: number) => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
  };

  const encode = (q: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/webp", q));

  draw(width, height);

  let quality = 0.9;
  let blob = await encode(quality);

  // First lower quality.
  while (blob && blob.size > maxBytes && quality > 0.4) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    blob = await encode(quality);
  }
  // Then progressively downscale if still too large.
  while (blob && blob.size > maxBytes && width > 640) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    draw(width, height);
    blob = await encode(0.8);
  }

  bitmap.close?.();

  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}
