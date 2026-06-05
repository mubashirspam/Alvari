"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getOrCreateFingerprint(): string {
  const key = "alvari_fp";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const fp = crypto.randomUUID();
  localStorage.setItem(key, fp);
  return fp;
}

function getOrCreateSession(): string {
  const key = "alvari_sid";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const sid = crypto.randomUUID().split("-")[0];
  sessionStorage.setItem(key, sid);
  return sid;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getUTM(search: string): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  const params = new URLSearchParams(search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin and API routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    try {
      const fingerprint = getOrCreateFingerprint();
      const sessionId = getOrCreateSession();
      const utm = getUTM(window.location.search);

      navigator.sendBeacon(
        "/api/track",
        JSON.stringify({
          fingerprint,
          sessionId,
          page: pathname,
          referrer: document.referrer || undefined,
          deviceType: getDeviceType(),
          ...utm,
        }),
      );
    } catch {
      // Never crash the page
    }
  }, [pathname]);

  return null;
}
