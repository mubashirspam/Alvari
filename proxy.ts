import { NextResponse, type NextRequest } from "next/server";
import { neonAuth } from "@/lib/auth/neon-auth";
import { envMode } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const authProxy = neonAuth.middleware({ loginUrl: "/admin/login" });

const BASIC_AUTH_REALM = "Alvari staging";
const BYPASS_PATHS = ["/api/cron", "/api/auth", "/admin/login", "/admin/setup"];

/**
 * True when the request carries either auth credential we accept: a Neon Auth
 * session token cookie or the legacy DB-backed admin session cookie. The proxy
 * is only the first gate — the page layout and every server action / API route
 * call `requireAdmin()`, which fully validates whichever session is present.
 */
function hasAdminSessionCookie(request: NextRequest): boolean {
  if (request.cookies.has(SESSION_COOKIE)) return true;
  return request.cookies.getAll().some((c) => c.name.includes("session_token"));
}

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

const REF_COOKIE = "alvari_ref";
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = envMode();

  // Capture ?ref= referral code into a 30-day cookie
  const refParam = request.nextUrl.searchParams.get("ref");
  let refResponse: NextResponse | null = null;
  if (refParam && refParam.length <= 64 && /^[A-Za-z0-9_-]+$/.test(refParam)) {
    refResponse = NextResponse.next();
    refResponse.cookies.set(REF_COOKIE, refParam.toUpperCase(), {
      maxAge: REF_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }
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
      const isRedirect = authResponse.status >= 300 && authResponse.status < 400;
      // Neon Auth wants to bounce to /admin/login. If the request already carries
      // a session cookie (Neon or legacy), don't hard-redirect — that breaks Next
      // server actions with "An unexpected response was received from the server".
      // Let it through and let requireAdmin()/the layout do the real validation.
      if (isRedirect && hasAdminSessionCookie(request)) {
        const passthrough = NextResponse.next();
        if (mode !== "production") applyNonProdHeaders(passthrough, mode);
        return passthrough;
      }
      if (mode !== "production") applyNonProdHeaders(authResponse, mode);
      return authResponse;
    }
  }

  // 3. Non-prod: tag every response with noindex so we never get crawled.
  if (mode !== "production") {
    const response = refResponse ?? NextResponse.next();
    applyNonProdHeaders(response, mode);
    return response;
  }

  return refResponse ?? undefined;
}

export const config = {
  matcher: [
    // Match everything except Next internals and static assets so the staging
    // headers + basic-auth wall apply site-wide.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map)$).*)",
  ],
};
