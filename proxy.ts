import { neonAuth } from "@/lib/auth/neon-auth";

const authProxy = neonAuth.middleware({ loginUrl: "/admin/login" });

export function proxy(request: import("next/server").NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/admin/setup") {
    return;
  }

  return authProxy(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
