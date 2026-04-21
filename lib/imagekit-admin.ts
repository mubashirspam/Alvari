export type ImageKitUploadResult = {
  fileId: string;
  name: string;
  filePath: string;
  url: string;
};

function makeAuth(): string {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) throw new Error("IMAGEKIT_PRIVATE_KEY not configured");
  return `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
}

export async function uploadToImageKit(
  file: Blob,
  fileName: string,
  folder: string,
): Promise<ImageKitUploadResult> {
  const fd = new FormData();
  fd.append("file", file, fileName);
  fd.append("fileName", fileName);
  fd.append("folder", folder.startsWith("/") ? folder : `/${folder}`);
  fd.append("useUniqueFileName", "true");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: makeAuth() },
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown error");
    throw new Error(`ImageKit upload failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<ImageKitUploadResult>;
}

export async function deleteFromImageKit(fileId: string): Promise<void> {
  try {
    await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: makeAuth() },
    });
  } catch {
    // Non-fatal — file may already be gone.
  }
}
