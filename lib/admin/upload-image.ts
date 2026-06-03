import { upload } from "@imagekit/next";
import { compressImage } from "./compress-image";

export type UploadFolder =
  | "products"
  | "banners"
  | "collections"
  | "categories"
  | "blog";

export type UploadedImage = {
  /** ImageKit file path, e.g. /staging/kaasth/banners/abc.webp */
  filePath: string;
  /** Final (compressed) size in KB. */
  sizeKb: number;
};

/**
 * Compresses an image to <300 KB, fetches a fresh ImageKit upload signature
 * scoped to `folder`, and uploads straight from the browser. Returns the stored
 * file path to persist on the record.
 */
export async function uploadImageToImageKit(
  file: File,
  folder: UploadFolder,
  onProgress?: (percent: number) => void,
): Promise<UploadedImage> {
  const compressed = await compressImage(file);

  const authRes = await fetch(`/api/upload-auth?folder=${encodeURIComponent(folder)}`);
  if (!authRes.ok) {
    const err = (await authRes.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? "Failed to get upload credentials");
  }
  const auth = (await authRes.json()) as {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
    folder?: string;
  };

  const safeFileName =
    compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `upload-${Date.now()}.webp`;

  const result = await upload({
    file: compressed,
    fileName: safeFileName,
    token: auth.token,
    expire: auth.expire,
    signature: auth.signature,
    publicKey: auth.publicKey,
    folder: auth.folder,
    useUniqueFileName: true,
    onProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });

  if (!result.filePath) throw new Error("ImageKit did not return a filePath");

  return { filePath: result.filePath, sizeKb: Math.round(compressed.size / 1024) };
}
