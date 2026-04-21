"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { upload } from "@imagekit/next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildImageKitUrl } from "@/lib/imagekit";
import type { ProductImageRow, ProductVariantRow } from "@/lib/db/schema";

type Props = {
  productId: string;
  initialImages: ProductImageRow[];
  variants: ProductVariantRow[];
};

export function ImageManager({ productId, initialImages, variants }: Props) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function reload() {
    const res = await fetch(`/api/admin/products/${productId}/images`);
    if (res.ok) {
      const data = (await res.json()) as { images: ProductImageRow[] };
      setImages(data.images);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const fileEntry = fd.get("file") as File | null;
    if (!fileEntry || !fileEntry.size) {
      setUploadError("Please select an image file first");
      return;
    }
    const alt = (fd.get("alt") as string) || "";
    const variantId = (fd.get("variantId") as string) || "";

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 1. Get upload auth params from our server
      const authRes = await fetch("/api/upload-auth");
      if (!authRes.ok) {
        const err = await authRes.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? "Failed to get upload credentials");
      }
      const { token, expire, signature, publicKey } = (await authRes.json()) as {
        token: string;
        expire: number;
        signature: string;
        publicKey: string;
      };

      // 2. Upload directly to ImageKit from the browser
      const safeFileName =
        fileEntry.name.replace(/[^a-zA-Z0-9._-]/g, "_") ||
        `upload-${Date.now()}.jpg`;

      const result = await upload({
        file: fileEntry,
        fileName: safeFileName,
        token,
        expire,
        signature,
        publicKey,
        folder: "/kaasth/products",
        useUniqueFileName: true,
        onProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      if (!result.filePath) throw new Error("ImageKit did not return a filePath");

      // 3. Save the image record in our DB
      const saveRes = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageKey: result.filePath,
          alt: alt || null,
          variantId: variantId || null,
        }),
      });
      const saveData = (await saveRes.json()) as { message?: string };
      if (!saveRes.ok) {
        throw new Error(saveData.message ?? `Save failed (${saveRes.status})`);
      }

      if (fileRef.current) fileRef.current.value = "";
      formRef.current?.reset();
      await reload();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(imageId: string, alt: string | null) {
    if (!confirm(`Delete image "${alt ?? imageId}"?`)) return;
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });
    await reload();
  }

  async function handleAltUpdate(imageId: string, alt: string) {
    await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt }),
    });
    await reload();
  }

  const sharedImages = images.filter((img) => !img.variantId);
  const variantImages = images.filter((img) => img.variantId);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-4 text-[15px] font-medium text-[var(--color-ink)]">
          Upload image
        </h3>
        <form
          ref={formRef}
          onSubmit={handleUpload}
          className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 space-y-4"
        >
          <div>
            <Label htmlFor="im-file">Image file *</Label>
            <input
              ref={fileRef}
              id="im-file"
              type="file"
              name="file"
              accept="image/*"
              required
              className="mt-2 block w-full text-sm text-[var(--color-muted)] file:mr-4 file:rounded-full file:border file:border-[var(--color-line)] file:bg-[var(--color-bg)] file:px-4 file:py-2 file:text-xs file:text-[var(--color-ink)] hover:file:border-[var(--color-accent)]"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="im-alt">Alt text</Label>
              <Input id="im-alt" name="alt" placeholder="Describe the image" />
            </div>
            <div>
              <Label htmlFor="im-variant">Attach to variant (optional)</Label>
              <select
                id="im-variant"
                name="variantId"
                className="w-full rounded-[4px] border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3.5 text-[15px] text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="">Shared (all variants)</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={uploading}
              className="rounded-full bg-[var(--color-ink)] px-6 py-2.5 text-xs uppercase tracking-widest text-[var(--color-bg)] disabled:opacity-60"
            >
              {uploading
                ? uploadProgress > 0
                  ? `Uploading… ${uploadProgress}%`
                  : "Uploading…"
                : "Upload image"}
            </button>
            {uploading && uploadProgress > 0 && (
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
                <div
                  className="h-full rounded-full bg-[var(--color-ink)] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {uploadError && (
              <span className="text-xs text-red-700">{uploadError}</span>
            )}
          </div>
        </form>
      </section>

      {sharedImages.length > 0 && (
        <section>
          <h3 className="mb-3 text-[13px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Shared images (all variants)
          </h3>
          <ImageGrid
            images={sharedImages}
            onDelete={handleDelete}
            onAltUpdate={handleAltUpdate}
          />
        </section>
      )}

      {variants.map((v) => {
        const vImages = variantImages.filter((img) => img.variantId === v.id);
        if (vImages.length === 0) return null;
        return (
          <section key={v.id}>
            <h3 className="mb-3 text-[13px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {v.name} ({v.sku})
            </h3>
            <ImageGrid
              images={vImages}
              onDelete={handleDelete}
              onAltUpdate={handleAltUpdate}
            />
          </section>
        );
      })}

      {images.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--color-muted)]">
          No images yet. Upload one above.
        </p>
      )}
    </div>
  );
}

function ImageGrid({
  images,
  onDelete,
  onAltUpdate,
}: {
  images: ProductImageRow[];
  onDelete: (id: string, alt: string | null) => void;
  onAltUpdate: (id: string, alt: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {images.map((img) => (
        <ImageCard
          key={img.id}
          image={img}
          onDelete={onDelete}
          onAltUpdate={onAltUpdate}
        />
      ))}
    </div>
  );
}

function ImageCard({
  image,
  onDelete,
  onAltUpdate,
}: {
  image: ProductImageRow;
  onDelete: (id: string, alt: string | null) => void;
  onAltUpdate: (id: string, alt: string) => void;
}) {
  const [editingAlt, setEditingAlt] = useState(false);
  const [altValue, setAltValue] = useState(image.alt ?? "");
  const [imgError, setImgError] = useState(false);

  const ikUrl = buildImageKitUrl(image.imageKey, {
    width: 400,
    height: 400,
    quality: 70,
    format: "auto",
    focus: "center",
  });

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
      <div className="relative aspect-square bg-[var(--color-bg-soft)]">
        {imgError ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
            <span className="text-[10px] text-[var(--color-muted)]">
              Not in ImageKit yet
            </span>
            <span className="break-all text-[9px] text-[var(--color-muted)] opacity-60">
              {image.imageKey}
            </span>
          </div>
        ) : (
          <Image
            src={ikUrl}
            alt={image.alt ?? "product image"}
            fill
            className="object-cover"
            sizes="200px"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="p-2.5 space-y-2">
        {editingAlt ? (
          <div className="flex gap-1.5">
            <input
              value={altValue}
              onChange={(e) => setAltValue(e.target.value)}
              className="min-w-0 flex-1 rounded border border-[var(--color-line)] px-2 py-1 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                onAltUpdate(image.id, altValue);
                setEditingAlt(false);
              }}
              className="rounded bg-[var(--color-ink)] px-2 py-1 text-[10px] text-[var(--color-bg)]"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingAlt(true)}
            className="block w-full truncate text-left text-[11px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            {image.alt ?? "Add alt text…"}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(image.id, image.alt)}
          className="w-full rounded-full border border-[var(--color-line)] py-1 text-[11px] text-red-700 hover:border-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
