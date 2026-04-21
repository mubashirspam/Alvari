import { NextResponse } from "next/server";
import { z } from "zod";
import { login } from "@/features/admin/services/admin-service";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  deleteSessionByToken,
  setSessionCookie,
} from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof loginSchema>;
  try {
    parsed = loginSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { message: "Please enter a valid email and password." },
      { status: 400 },
    );
  }

  const userAgent = request.headers.get("user-agent");
  const result = await login(parsed.email, parsed.password, userAgent);

  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 401 });
  }

  await setSessionCookie(result.token, result.expiresAt);

  return NextResponse.json({
    admin: {
      id: result.admin.id,
      email: result.admin.email,
      role: result.admin.role,
      name: result.admin.name,
    },
  });
}

export async function DELETE(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null;

  if (token) {
    await deleteSessionByToken(token);
  }
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
