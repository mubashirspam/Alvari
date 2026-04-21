import { NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server";
import { requireAdmin } from "@/lib/auth/session";

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

  return NextResponse.json({ token, expire, signature, publicKey });
}
