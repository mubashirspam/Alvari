import { NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server";
import { requireAdmin } from "@/lib/auth/session";
import { env, envMode } from "@/lib/env";

const BASE_FOLDER = "kaasth/products";

function resolveFolder(): string {
  const prefix = env.IMAGEKIT_FOLDER_PREFIX?.trim().replace(/^\/+|\/+$/g, "");
  if (prefix) return `/${prefix}/${BASE_FOLDER}`;
  // Fallback: derive from env mode so we never overwrite prod from staging by accident.
  const mode = envMode();
  if (mode === "production") return `/prod/${BASE_FOLDER}`;
  if (mode === "staging") return `/staging/${BASE_FOLDER}`;
  return `/dev/${BASE_FOLDER}`;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { message: "ImageKit keys not configured" },
      { status: 500 },
    );
  }

  const { token, expire, signature } = getUploadAuthParams({
    privateKey,
    publicKey,
  });

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
    folder: resolveFolder(),
  });
}
