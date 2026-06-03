import { NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server";
import { requireAdmin } from "@/lib/auth/session";
import { env, envMode } from "@/lib/env";

const BASE = "kaasth";

// Allowlisted sub-folders. Any unknown value falls back to "products".
const ALLOWED_KINDS: Record<string, string> = {
  products: "products",
  banners: "banners",
  collections: "collections",
  categories: "categories",
  blog: "blog",
};

function envPrefix(): string {
  const prefix = env.IMAGEKIT_FOLDER_PREFIX?.trim().replace(/^\/+|\/+$/g, "");
  if (prefix) return prefix;
  // Fallback: derive from env mode so we never overwrite prod from staging by accident.
  const mode = envMode();
  if (mode === "production") return "prod";
  if (mode === "staging") return "staging";
  return "dev";
}

function resolveFolder(kind: string | null): string {
  const sub = (kind && ALLOWED_KINDS[kind]) || ALLOWED_KINDS.products;
  return `/${envPrefix()}/${BASE}/${sub}`;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const kind = new URL(request.url).searchParams.get("folder");

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
    folder: resolveFolder(kind),
  });
}
