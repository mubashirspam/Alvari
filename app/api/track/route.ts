import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViews } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  let body: { fingerprint?: string; page?: string; referrer?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; deviceType?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.fingerprint || !body.page) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Extract city from Vercel geo headers (no external API needed)
  const city = req.headers.get("x-vercel-ip-city") ?? null;
  const country = req.headers.get("x-vercel-ip-country") ?? null;

  // Fire-and-forget insert — never block the page load
  void db.insert(pageViews).values({
    fingerprint: body.fingerprint.slice(0, 64),
    page: body.page.slice(0, 500),
    referrer: body.referrer?.slice(0, 500) ?? null,
    utmSource: body.utmSource?.slice(0, 100) ?? null,
    utmMedium: body.utmMedium?.slice(0, 100) ?? null,
    utmCampaign: body.utmCampaign?.slice(0, 100) ?? null,
    deviceType: body.deviceType?.slice(0, 50) ?? null,
    city,
    country,
    sessionId: body.sessionId?.slice(0, 64) ?? null,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
