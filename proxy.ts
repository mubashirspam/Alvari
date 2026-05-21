import { NextResponse, type NextRequest } from "next/server";
import { neonAuth } from "@/lib/auth/neon-auth";
import { envMode } from "@/lib/env";

const authProxy = neonAuth.middleware({ loginUrl: "/admin/login" });

const BASIC_AUTH_REALM = "Alvari staging";
const BYPASS_PATHS = ["/api/cron", "/api/auth", "/admin/login", "/admin/setup"];

function basicAuthChallenge(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}"`,
      "Content-Type": "text/plain",
    },
  });
}

function checkBasicAuth(request: NextRequest, password: string): boolean {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const [, providedPass] = decoded.split(":");
    return providedPass === password;
  } catch {
    return false;
  }
}

function applyNonProdHeaders(response: NextResponse, mode: string): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("X-Env-Mode", mode);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = envMode();
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/admin/setup";

  // 1. Optional basic-auth wall for staging (skip for cron + auth callbacks).
  if (mode === "staging" && process.env.STAGING_PASSWORD) {
    const isExempt = BYPASS_PATHS.some((p) => pathname.startsWith(p));
    if (!isExempt && !checkBasicAuth(request, process.env.STAGING_PASSWORD)) {
      return basicAuthChallenge();
    }
  }

  // 2. Admin routes still flow through Neon Auth.
  if (isAdminRoute && !isPublicAdminRoute) {
    const authResponse = await authProxy(request);
    if (authResponse) {
      if (mode !== "production") applyNonProdHeaders(authResponse, mode);
      return authResponse;
    }
  }

  // 3. Non-prod: tag every response with noindex so we never get crawled.
  if (mode !== "production") {
    const response = NextResponse.next();
    applyNonProdHeaders(response, mode);
    return response;
  }
}

export const config = {
  matcher: [
    // Match everything except Next internals and static assets so the staging
    // headers + basic-auth wall apply site-wide.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
