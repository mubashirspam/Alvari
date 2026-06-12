import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { z } from "zod";
import { login } from "@/features/admin/services/admin-service";
import { auth } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth/constants";

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

  // login() validates the role and establishes the Better Auth session cookie.
  const result = await login(parsed.email, parsed.password);
  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore — clear the legacy cookie below regardless
  }
  const jar = await cookies();
  try {
    jar.delete(SESSION_COOKIE);
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}
