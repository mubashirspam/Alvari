import { env } from "@/lib/env";

// Verification key for the IndexNow protocol. The submission API points its
// `keyLocation` at this route; the body must be exactly the key string.
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET(): Response {
  const key = env.INDEXNOW_KEY;
  if (!key) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
