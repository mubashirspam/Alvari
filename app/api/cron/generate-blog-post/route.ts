import { NextResponse } from "next/server";
import { env, isProd } from "@/lib/env";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { generateNextPost } from "@/features/blog/services/blog-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${env.CRON_SECRET}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === env.CRON_SECRET) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isProd()) {
    return NextResponse.json({
      ok: true,
      skipped: "non-production",
      message:
        "Cron is gated to production deployments only. Set NEXT_PUBLIC_ENV_MODE=production to override locally.",
    });
  }
  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { ok: false, error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const outcome = await generateNextPost();
    if (outcome.status === "no_topics_left") {
      return NextResponse.json({
        ok: true,
        status: "no_topics_left",
        message:
          "All seed topics have been used. Add more topics in lib/content/topics.ts.",
      });
    }
    return NextResponse.json({
      ok: true,
      status: "generated",
      topicSlug: outcome.topicSlug,
      post: {
        slug: outcome.post.slug,
        title: outcome.post.title,
        readingMinutes: outcome.post.readingMinutes,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = GET;
