import { env, isProd, siteConfig } from "@/lib/env";

// IndexNow lets us proactively notify Bing, Yandex, Naver, Seznam (and others
// that share the protocol) the instant a URL is created or changed, instead of
// waiting for the next crawl. Google does not consume IndexNow, but it costs
// nothing and speeds up the engines that do.
//
// The key is published at /indexnow-key.txt (see app/indexnow-key.txt/route.ts).
// We pass `keyLocation` explicitly so the file need not be named after the key.

const ENDPOINT = "https://api.indexnow.org/indexnow";

function host(): string {
  return new URL(siteConfig.url).host;
}

function keyLocation(): string {
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  return `${base}/indexnow-key.txt`;
}

function absolute(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Fire-and-forget submission of changed URLs to IndexNow. No-ops outside
 * production or when INDEXNOW_KEY is unset, and never throws into the caller.
 */
export function submitToIndexNow(paths: string | string[]): void {
  const key = env.INDEXNOW_KEY;
  if (!key || !isProd()) return;

  const list = (Array.isArray(paths) ? paths : [paths]).map(absolute);
  if (list.length === 0) return;

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: host(),
      key,
      keyLocation: keyLocation(),
      urlList: list,
    }),
  }).catch((error) => {
    console.error("[indexnow] submission failed", error);
  });
}
