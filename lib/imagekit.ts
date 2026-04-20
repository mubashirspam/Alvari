import { env } from "@/lib/env";

type ImageTransform = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  focus?: "auto" | "face" | "center";
};

export function buildImageKitUrl(path: string, transform: ImageTransform = {}): string {
  const endpoint = env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return path;

  if (/^https?:\/\//i.test(path)) return path;

  const segments: string[] = [];
  if (transform.width) segments.push(`w-${transform.width}`);
  if (transform.height) segments.push(`h-${transform.height}`);
  if (transform.quality) segments.push(`q-${transform.quality}`);
  if (transform.format) segments.push(`f-${transform.format}`);
  if (transform.focus) segments.push(`fo-${transform.focus}`);

  const tr = segments.length > 0 ? `tr:${segments.join(",")}/` : "";
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;

  return `${base}${tr}${normalizedPath}`;
}
