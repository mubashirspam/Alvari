import { NextResponse, type NextRequest } from "next/server";
import { envMode } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/auth/constants";

const BASIC_AUTH_REALM = "Alvari staging";
const BYPASS_PATHS = ["/api/cron", "/api/auth", "/admin/login", "/admin/setup"];

/**
 * True when the request carries an auth credential we accept: a Better Auth
 * session token cookie (`better-auth.session_token`) or the legacy DB-backed
 * admin session cookie. The proxy is only the first gate — the page layout and
 * every server action / API route call `requireAdmin()`, which fully validates
 * the session AND the role (customers are rejected there).
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

  // 2. Admin routes: first gate is cookie presence. Full session + role
  //    validation happens in the admin layout and requireAdmin(). Bounce to
  //    login only when no session cookie is present at all (avoids breaking
  //    Next server actions for signed-in users).
  if (isAdminRoute && !isPublicAdminRoute && !hasAdminSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    const redirectResp = NextResponse.redirect(url);
    if (mode !== "production") applyNonProdHeaders(redirectResp, mode);
    return redirectResp;
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
